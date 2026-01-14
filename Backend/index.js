import cors from "cors";
import express from "express";


const app = express();

export const chatMessages = [
    { message: "Welcome to the chat." },
    { message: "Hi there, how are you" },
    { message: "How are you feeling today?" },
    { message: "I'm not to bad thanks you...wait, why am I asking myself this question?" }
]

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
    res.json(chatMessages);
});

// app.post('/chat', (req, res) => {

// });


export default app;