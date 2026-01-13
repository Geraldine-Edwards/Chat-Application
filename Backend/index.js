import cors from "cors";
import express from "express";


const app = express();
const port = 3000;
const chatMessages = [
    { message: "Welcome to the chat." },
    { message: "Hi there, how are you" },
    { message: "How are you feeling today?" },
    { message: "I'm not to bad thanks you...wait, why am I asking myself this question?" }
]

app.use(cors());


// validate chat messages


app.get('/chat', (req, res) => {
    console.error("Received a request for chat messages");
    res.json(chatMessages);
});

// app.post('/chat', (req, res) => {

// });

app.listen(port, () => {
    console.error(`Chat server listening on port ${port}`);
})

export default app;