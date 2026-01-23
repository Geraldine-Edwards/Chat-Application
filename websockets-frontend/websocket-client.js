import { API_BASE_URL } from './config.js';


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
    clientSocket.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'new-message') {
                //this calls the appendMessagesToChat() function in display-chat.js with the message data
                onNewMessage(msg.data); 
            } else {
                console.log("Other message from server:", msg);
            }
        } catch (err) {
            console.error("Error parsing WebSocket message:", err)
        }
    };    

    clientSocket.onerror = (err) => {
        console.error("WebSocket error:", err);
        const chatMessagesDiv = document.querySelector("#chat-messages");
        if (!chatMessagesDiv.querySelector('.chat-error')) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = "Connection problem: Unable to receive live updates. Trying to reconnect...";
        errorDiv.className = "chat-error";
        chatMessagesDiv.appendChild(errorDiv);
        }
    };

    clientSocket.onclose = () => {
        console.warn("WebSocket closed, reconnecting in 2s...");
        //set the value of the websocket status flag to off
        if (setWsConnected) setWsConnected(false);
        setTimeout(() => setUpClientWebSocket(onNewMessage), 2000)
    }

    
   

}