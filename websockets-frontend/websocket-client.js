import { API_BASE_URL } from './config.js';

//handle incoming WebSocket messages
function handleSocketMessage(event, onNewMessage) {
    try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'new-message') {
            onNewMessage(msg.data);
        } else {
            console.log("Other message from server:", msg);
        }
    } catch (err) {
        console.error("Error parsing WebSocket message:", err);
    }
}

//show a WebSocket connection error in the chat display
function showWebSocketError() {
    const chatMessagesDiv = document.querySelector("#chat-messages");
    if (!chatMessagesDiv.querySelector('.chat-error')) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = "Connection problem: Unable to receive live updates. Trying to reconnect...";
        errorDiv.className = "chat-error";
        chatMessagesDiv.appendChild(errorDiv);
    }
}

export function setUpClientWebSocket(onNewMessage, setWsConnected){
    const webSocketProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    //import the origins from display-chat.js (but split the https:// protocol part so it fits for webSocketProtocol
    const webSocketHost = API_BASE_URL.replace(/^https?:\/\//, '');
    const webSocketUrl = `${webSocketProtocol}://${webSocketHost}`;

    const clientSocket = new WebSocket(webSocketUrl);

    //confirm the client socket is open with a log message
    clientSocket.onopen = () => {
        console.log("WebSocket connected")
        //check the status of the websocket from display-chat.js and if off, turn on
        if (setWsConnected) setWsConnected(true);
    }

    //handle incoming msgs from the server (such as handshake or broadcast msgs - parse the msg data)
    clientSocket.onmessage = (event) => handleSocketMessage(event, onNewMessage);
   

    clientSocket.onerror = (err) => {
        console.error("WebSocket error:", err);
        showWebSocketError();
    };

    clientSocket.onclose = () => {
        console.warn("WebSocket closed, reconnecting in 2s...");
        //set the value of the websocket status flag to off
        if (setWsConnected) setWsConnected(false);
        setTimeout(() => setUpClientWebSocket(onNewMessage), 2000)
    };

}