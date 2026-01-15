import cors from "cors";
import crypto from 'crypto';
import express from "express";


const app = express();
app.use(express.json());

export const chatMessages = []

function createMessage(text) {
  return {
    id: crypto.randomUUID(), //generates a UUID v4
    message: text,
    timestamp: new Date().toISOString(),
  };
}

app.use(cors());

app.get('/chat', (req, res) => {
    //validate chat messages
    for (const msg of chatMessages) {
        if (
            typeof msg !== 'object' ||
            msg === null ||
            !msg.hasOwnProperty('message') ||
            typeof msg.message !== 'string' ||
            msg.message.length === 0
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
    const { message } = req.body;
    if (typeof message !== 'string' || message.length === 0) {
        return res.status(400).json({ error: 'Message must be a non-empty string' });
    }
    //add the new message object to the array
    chatMessages.push(createMessage(message));
    //return the updated array of message objects to immediately display all messages without using another GET request
    res.status(201).json({ messages: chatMessages });
});


export default app;