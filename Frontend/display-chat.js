//set the base API URL
const API_BASE_URL =
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:3000"
    : "https://geraldine-edwards-chat-application-backend.hosting.codeyourfuture.io";

async function fetchAndDisplayChatMessages() {
    try {
        const response = await fetch(`${API_BASE_URL}/chat`);
        if (!response.ok) throw new Error('Error fetching chat')
            const data = await response.json()

        const chatMessagesDiv = document.querySelector("#chat-messages");
        chatMessagesDiv.innerHTML = '';
        data.forEach(msg => {
            //create a wrapper for each message
            const wrapper = document.createElement('div');
            wrapper.className = "chat-message-wrapper";

            //sender name (small text above bubble)
            const nameDiv = document.createElement('div');
            nameDiv.className = "chat-sender";
            nameDiv.textContent = msg.sender || "Anonymous";
            wrapper.appendChild(nameDiv);

            //message bubble
            const bubbleDiv = document.createElement('div');
            bubbleDiv.className ="chat-bubble";
            bubbleDiv.textContent = msg.message;
            wrapper.appendChild(bubbleDiv);
            
            chatMessagesDiv.appendChild(wrapper)
        });
;    } catch (error) {
        document.querySelector("#chat-messages").innerText = "Sorry could not load chat"
        console.error(error)
    }
}

// show the current chat when the page loads
window.addEventListener("load", fetchAndDisplayChatMessages)


async function addChatMessage(newMessage, senderName) {
    const backendURL = `${API_BASE_URL}/chat`;
    const userFeedbackDiv = document.getElementById('add-chat-message');
    //clear the feedback div
    userFeedbackDiv.textContent = '';
    //clear the feedback div classes
    userFeedbackDiv.classList.remove('add-chat-success', 'add-chat-error');

    try {
        const response = await fetch(backendURL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ message: newMessage, sender: senderName})
        });
        if (response.ok) {
            fetchAndDisplayChatMessages();
            userFeedbackDiv.textContent = 'Message sent!';
            userFeedbackDiv.classList.add('add-chat-success');      
        } else {
            const data = await response.json();
            userFeedbackDiv.textContent = data.error || 'Failed to send message.';
            userFeedbackDiv.classList.add('add-chat-error');
        }
        setTimeout(() => {
            userFeedbackDiv.textContent = '';
            userFeedbackDiv.classList.remove('add-chat-success', 'add-chat-error');
        }, 2000);
    } catch (error) {
        userFeedbackDiv.textContent = 'Network error. Please try again.';
        userFeedbackDiv.classList.add('add-chat-error');
        setTimeout(() => {
            userFeedbackDiv.textContent = '';
            userFeedbackDiv.classList.remove('add-chat-error');
        }, 3000);
        console.error(error)
    }
}

// add a submit handler to the form
document.getElementById('add-message-form').addEventListener('submit', function(event) {
    event.preventDefault()
    const newMessage = document.getElementById('new-message').value;
    const senderName = document.getElementById('sender-name').value;
    addChatMessage(newMessage, senderName);
    document.getElementById('new-message').value = '';
    document.getElementById('sender-name').value = '';
});
