import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from 'crypto';
import express from "express";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);


const app = express();
app.use(express.json());
app.use(cookieParser());

//temp storage
export const chatMessages = [];
export const users = new Map();

function createMessage(text, sender) {
  return {
    messageId: crypto.randomUUID(), //generates a UUID v4
    message: text,
    sender: sender,
    timestamp: new Date().toISOString(),
  };
}

function sanitizeHTML(str) {
    //chars are displayed as plain text in browsers
  return DOMPurify.sanitize(str, { FORBID_ATTR: ['style']});
}

const ALLOWED_ORIGINS = [
  "http://127.0.0.1:5500",

  "http://localhost:3000",
  "https://geraldine-edwards-chat-application-frontend.hosting.codeyourfuture.io"
];

//use CORS middleware with dynamic origin check + credentials
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

app.get('/chat', (req, res) => {
    //validate chat messages
    for (const msg of chatMessages) {
        if (
            typeof msg !== 'object' ||
            msg === null ||
            typeof msg.messageId !== 'string' ||
            !msg.hasOwnProperty('message') ||
            typeof msg.message !== 'string' ||
            msg.message.length === 0 ||
            typeof msg.timestamp !== 'string'
        ) {
            return res.status(400).json({ error: 'Message must be a string' });
        }
    }
    console.error("Received a request for chat messages");
    //return the full message objects
    res.json(chatMessages);
});

app.post('/identity', (req, res) => {
    //check if users have a cookie already; server is the authority
    let userId = req.cookies.userId;

    if (!userId) {
        //generate new (anonymous) user id
        userId = crypto.randomUUID();

        //store creation info in server memory
        users.set(userId, {
        createdAt:new Date().toISOString()
        });
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

    res.json({userId});
});

app.post('/chat', (req, res) => {
    const userId = req.cookies.userId;

    if (!userId) {
        return res.status(401).json({error: "No identity cookie found"});
    }

    //use destructuring to extract the 'message' property from the incoming request body
    const { message, sender } = req.body;
    if (typeof message !== 'string' || 
        message.trim().length === 0 || 
        message.length > 300 ||
        typeof sender !== 'string' ||
        sender.trim().length === 0 ||
        sender.length > 50
    ) {
        return res.status(400).json({ error: "Message and sender's name must be non-empty strings (max 300 chars for message, 50 for sender)" });
    }
    //sanitize the input using DOMPurify
    const safeMessage = sanitizeHTML(message);
    const safeSender = sanitizeHTML(sender);
    //add the new message object to the array
    chatMessages.push({
        ...createMessage(safeMessage, safeSender),
        userId
    });
    //return the updated array of message objects to immediately display all messages without using another GET request
    res.status(201).json({ messages: chatMessages });
});


export default app;