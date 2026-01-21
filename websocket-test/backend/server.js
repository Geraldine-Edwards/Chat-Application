import { WebSocketServer } from 'ws';

//1. establish the server
const wss = new WebSocketServer({ port: 3000 }); //wss is an instance of WebSocket server
console.log("WebSocket server running on ws://localhost:3000");

//2. execute functionality/messages on different connection events ("connection" is an event like "click")
wss.on("connection", (clientSocket) => { //clientSocket = variable name
    console.log("Client connected");

    //test that the server pushes data by sending a message to client immediately
    clientSocket.send("Hello");

    //optional: log any messages from teh client
    clientSocket.on("message", (data) => {
    console.log("Message from client: ", data.toString());
    });

    //detect when this client disconnects
    clientSocket.on("close", () => {
        console.log("Client disconnected");
    });


});