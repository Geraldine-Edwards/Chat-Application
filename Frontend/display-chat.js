async function fetchAndDisplayChatMessages() {
    try {
        const response = await fetch('http://localhost:3000/chat');
        if (!response.ok) throw new Error('Error fetching chat')
            const data = await response.json()

        const chatMessagesDiv = document.querySelector("#chat-messages");
        chatMessagesDiv.innerHTML = '';
        data.forEach(msg => {
            const div = document.createElement('div');
            div.className ="chat-bubble";
            div.textContent = msg.message;
            chatMessagesDiv.appendChild(div)
        });
;    } catch (error) {
        document.querySelector("#chat-messages").innerText = "Sorry could not load chat"
        console.error(error)
    }
}

// show the current chat when the page loads
window.addEventListener("load", fetchAndDisplayChatMessages)


async function addChatMessage(newMessage) {
    const backendURL = 'http://localhost:3000/chat';
    const userFeedbackDiv = document.getElementById('add-chat-message');
    //clear the feedback div
    userFeedbackDiv.textContent = '';
    //clear the feedback div classes
    userFeedbackDiv.classList.remove('add-chat-success', 'add-chat-error');

    try {
        const response = await fetch(backendURL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ message: newMessage})
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
    addChatMessage(newMessage);
    document.getElementById('new-message').value = '';
});
