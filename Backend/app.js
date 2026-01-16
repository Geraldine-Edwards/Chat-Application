import cors from "cors";
import crypto from 'crypto';
import express from "express";


const app = express();
app.use(express.json());

export const chatMessages = [];


function createMessage(text, sender) {
  return {
    id: crypto.randomUUID(), //generates a UUID v4
    message: text,
    sender: sender,
    timestamp: new Date().toISOString(),
  };
}

function escapeHTML(str) {
    //chars are displayed as plain text in browsers
  return str.replace(/[&<>"']/g, match => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[match]));
}

const ALLOWED_ORIGINS = [
  "http://127.0.0.1:5500",
  "http://localhost:3000",
  "https://geraldine-edwards-chat-application-frontend.hosting.codeyourfuture.io"
];

app.use(cors({origin: ALLOWED_ORIGINS}));

app.get('/chat', (req, res) => {
    //validate chat messages
    for (const msg of chatMessages) {
        if (
            typeof msg !== 'object' ||
            msg === null ||
            typeof msg.id !== 'string' ||
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

app.post('/chat', (req, res) => {
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
    //sanitize the input
    const safeMessage = escapeHTML(message);
    const safeSender = escapeHTML(sender);
    //add the new message object to the array
    chatMessages.push(createMessage(message, sender));
    //return the updated array of message objects to immediately display all messages without using another GET request
    res.status(201).json({ messages: chatMessages });
});


export default app;