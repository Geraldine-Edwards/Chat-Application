import app from './app.js';
import http from 'http';
import { WebSocketServer } from 'ws';
import { ALLOWED_ORIGINS } from './app.js';

//create http server using Express app
const server = http.createServer(app);

//attach a websocket server to the just created http server
export const serverSocket = new WebSocketServer({ server });

serverSocket.on('connection', (clientSocket, req) => {
  //manually check the origin header in the WebSocket server
  const origin = req.headers.origin;
  //if the origin from the client is not in the allowed list then close connection 
  if (!ALLOWED_ORIGINS.includes(origin)) {
    //closes on the server end & so client gets disconnected
    clientSocket.close();
    return
  }
  console.log("WebSocket client connected");
  //server sends a message to client end (the client expects JSON)
  clientSocket.send(JSON.stringify({ type: 'handshake', data: 'Hello from WebSocket server!' }));
  //logs a confirmation when the server receives a message from the client
  clientSocket.on('message', message => {
    console.log('Received:', message.toString());
  });
});


const port = 3000;

server.listen(port, () => {
  console.log(`Chat server (HTTP & WebSocket) listening on port ${port}`);
});

