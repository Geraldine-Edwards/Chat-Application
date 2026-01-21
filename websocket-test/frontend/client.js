//1. get the output div
const output = document.getElementById("output");

//2. create the WebSocket connection
const socket = new WebSocket("ws://localhost:3000");

//3.every time the server sends a message, socket.onmessage is called
socket.onmessage = (event) => {
    console.log("Message from server: ", event.data); //event.data contains the message from teh server
    output.innerHTML += "Server says: " + event.data + "<br>";
};

//4. handle when the connection opens
socket.onopen = () => {
    console.log("connected to server");
    //display the message in the output div
    output.innerHTML = "Connected to server!<br>";
};

//5. optional: handle errors
socket.onerror = (err) => {
    console.error("WebSocket error: ", err);
    output.innerHTML += "WebSocket error occurred<br>";
};

//6. handle when the connection closes
socket.onclose = () => {
    console.log("Disconnected from server");
    output.innerHTML += "Disconnected from server<br>";
}


