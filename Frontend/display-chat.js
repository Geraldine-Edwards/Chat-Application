//set the base API URL
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:3000"
    : "https://geraldine-edwards-chat-application-backend.hosting.codeyourfuture.io";

//create a state object
const state = {
    messages: [],
    userId: null,
    loading: false,
    error: null
};

async function ensureUserId() {
  try {
    const response = await fetch(`${API_BASE_URL}/identity`, {
      method: "POST",
      credentials: "include" //important to store HttpOnly cookies
    });
    const data = await response.json();

    //store the user id from the data in the state object
    state.userId = data.userId;

    return data.userId;
  } catch (err) {
    console.error("Failed to get user identity:", err);
  }
}

async function fetchAndDisplayChatMessages() {
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            //ensures the cookie is sent for userId
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Error fetching chat');
        
        const data = await response.json();

        //store the messages from teh data in the state object
        state.messages = data;
        state.error = null;
        renderChatMessages();
    } catch (error) {
        state.error = "Sorry could not load chat";
        renderChatMessages();
        console.error(error);
    } finally {
        state.loading = false;
    }
}

        
function renderChatMessages() {
    const chatMessagesDiv = document.querySelector("#chat-messages");
    chatMessagesDiv.innerHTML = '';

    if (state.loading) {
        chatMessagesDiv.textContent = "Loading messages...";
        return;
    }

    if (state.error) {
        chatMessagesDiv.textContent = state.error;
        return;
    }

    //if no messages, display the welcome message
    if (state.messages.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = "chat-placeholder";
        placeholder.textContent = "No messages yet. Start the conversation!";
        chatMessagesDiv.appendChild(placeholder);
        return;
    }

    state.messages.forEach(msg => {
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
};


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
            body: JSON.stringify({ message: newMessage, sender: senderName}),
            //send userId cookies
            credentials: 'include'
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
        }, 8000);

    } catch (error) {
        userFeedbackDiv.textContent = 'Network error. Please try again.';
        userFeedbackDiv.classList.add('add-chat-error');
        setTimeout(() => {
            userFeedbackDiv.textContent = '';
            userFeedbackDiv.classList.remove('add-chat-error');
        }, 10000);
        console.error(error);
    }
}

//add a submit handler to the form
document.getElementById('add-message-form').addEventListener('submit', function(event) {
    event.preventDefault()

    const newMessage = document.getElementById('new-message').value;
    const senderName = document.getElementById('sender-name').value;

    addChatMessage(newMessage, senderName);

    //clear form fields
    document.getElementById('new-message').value = '';
    document.getElementById('sender-name').value = '';
});


//ensure id, and show current chat when the page loads
window.addEventListener("load", async () => {
    await ensureUserId();
    await fetchAndDisplayChatMessages()

    //poll for new messages every 2 seconds
    setInterval(fetchAndDisplayChatMessages, 2000);
});

