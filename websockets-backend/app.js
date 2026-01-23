import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from 'crypto';
import express from "express";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import { serverSocket } from "./server.js";

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);


const app = express();

app.use(express.json());
app.use(cookieParser());
//use CORS middleware with dynamic origin check + credentials for HTTP server (REST API)
app.use(cors({
  origin: function(origin, callback) {
    //allow requests with no origin (like curl or same-origin)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, origin);  //allow this origin
    } else {
      callback(new Error("Not allowed by CORS")); //reject others
    }
  },
  credentials: true //this is important as it allows cookies to be sent cross-origin
}));

export const ALLOWED_ORIGINS = [
  "http://127.0.0.1:5500",

  "http://localhost:3000",
  "https://geraldine-edwards-chat-app-websockets-frontend.hosting.codeyourfuture.io"
];

//temp storage
export const chatMessages = [];
export const users = new Map();

let waitingClients = [];

function createMessage(text, sender) {
    return {
        messageId: crypto.randomUUID(), //generates a UUID v4
        message: text,
        sender: sender,
        timestamp: Date.now(),
    };
}

function isValidMessageInput(message,sender) {
    return (
        typeof message === 'string' && 
        message.trim().length > 0 && 
        message.length <= 300 &&
        typeof sender === 'string' &&
        sender.trim().length > 0 &&
        sender.length <= 50
    );
}

function sanitizeHTML(str) {
    //chars are displayed as plain text in browsers
    return DOMPurify.sanitize(str, { FORBID_ATTR: ['style']});
}

function validateAllMessages() {
    for (const msg of chatMessages) {
        if (
        typeof msg !== "object" ||
        msg === null ||
        typeof msg.messageId !== "string" ||
        typeof msg.message !== "string" ||
        msg.message.length === 0 ||
        typeof msg.timestamp !== "number"
        ) {
        return false;
        }
    }
    return true;
}

function validateAndSanitizeMessage(body, res) {
    //use destructuring to extract the 'message' property from the incoming request body
    const { message, sender , color} = body;

    if (!isValidMessageInput(message, sender)) {
        res.status(400).json({ error: "Message and sender's name must be non-empty strings (max 300 chars for message, 50 for sender)" });
        return null;
    }

    //return the validated object
    return {
        //sanitize the input using DOMPurify
        message: sanitizeHTML(message),
        sender: sanitizeHTML(sender),
        color: typeof color ==='string'? color : '#000000'
    };
}

//check that any stored messages are valid; reject request if not
function ensureValidStoredMessages(res) {
    if (chatMessages.length > 0 && !validateAllMessages()) {
    res.status(400).json({ error: "Invalid message data" });
    return false;
  }
  return true;
}

//add the client to the long-polling queue
function registerWaitingClient(res, since) {
    //store the response object and the timestamp in the array
    const client =  { res, since };
    waitingClients.push(client);

    //if no new messages arrive during the timeout respond with an empty array
    const timeout = setTimeout(() => {
        removeWaitingClient(client);
        res.json([]);
    }, 30000);

    //clean up if client disconnects early (before timeout completes)
    res.on('close', () => {
        //use the 'clear timeout' method
        clearTimeout(timeout);
        removeWaitingClient(client);
    }); 
}

function removeWaitingClient(client) {
    //find the index position of the client in the client waitingClients array
    const index = waitingClients.indexOf(client);
    
    //if client is found in teh array (i.e. index is not -1)
    if (index !== -1) waitingClients.splice(index, 1);
}

//use the httpOnly, secure and sameSite features from the HTTP(S) Set-Cookie headers
function ensureUserId(req, res) {
 //check if users have a cookie already; server is the authority
    let userId = req.cookies.userId;

    if (!userId) {
        //generate new (anonymous) user id
        userId = crypto.randomUUID();

        //store creation info in server memory
        users.set(userId, {createdAt:new Date().toISOString()});

        //set the cookie in teh browser
         res.cookie("userId", userId, {
            //JS cannot read/modify
            httpOnly: true,
            //protects against CSRF
            sameSite: "lax",
            //only over HTTPS in production (works locally over HTTP)
            secure: process.env.NODE_ENV === 'production'
        });
    }
    
    return userId;
}

function ensureUserCookie(req, res){
    const userId = req.cookies.userId;

    if (!userId) {
        res.status(401).json({error: "No identity cookie found"});
        return null;
    }
    return userId;
}

function broadcastMessage(newMsg) {
    //broadcast to all connected WebSocket clients
    if (serverSocket && serverSocket.clients) {
        serverSocket.clients.forEach(client => {
            if (client.readyState === client.OPEN) {
                client.send(JSON.stringify({type: 'new-message', data: newMsg}));
            }
        });
    }

    //for any long-polling clients:
    //send the new message as json response to all clients waiting for a new message
    waitingClients.forEach(client => client.res.json([newMsg]));
    //clear the array after notifying all clients
    waitingClients = [];
}

//keep HTTP GET endpoint for reliability of fetching all messages using the correct state
app.get('/chat', (req, res) => {
    //validate stored messages
    if (!ensureValidStoredMessages(res)) return;

    //check which message to send:
    //read the since parameter from the request query (if exists), if not, defaults to 0 (i.e. give all the messages from the beginning)
    const since = req.query.since ? Number(req.query.since) : 0;

    //filter messages to newer ones than the client's last seen timestamp
    const newMessages = chatMessages.filter(msg => msg.timestamp > since);
    
    //respond immediately if new messages
    if (newMessages.length > 0) {
        return res.json(newMessages);
    }
    
    //otherwise register the client for long-polling
    registerWaitingClient(res, since);
});


//keep the HTTP POST endpoint for identity cookies using the set cookie headers function
app.post('/identity', (req, res) => {
   const userId = ensureUserId(req, res);
   res.json({userId})
});

//use both HTTP POST and webSocket server for broadcasting new messages to all connected HTTP/WebSocket clients
app.post('/chat', (req, res) => {
    //check for a client cookie id
    const userId = ensureUserCookie(req, res);
    if (!userId) return;
    
    //check incoming request body is cleaned/safe
    const sanitized = validateAndSanitizeMessage(req.body, res);
    if (!sanitized) return;

    //use createMessage to make a message object, now with userId, colour and likes/dislikes
    const newMsg = {
    ...createMessage(sanitized.message, sanitized.sender),
    userId: userId,
    color: sanitized.color,
    likes: 0,
    dislikes: 0
    };

    //add the new message to the chat history
    chatMessages.push(newMsg);
    broadcastMessage(newMsg);

    //send a 201 confirmation status response to the client who sent the new msg
    res.status(201).json({ message: newMsg });
});


export default app;
