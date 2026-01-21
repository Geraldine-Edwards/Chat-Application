const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:3000"
    : "https://geraldine-edwards-chat-application-backend.hosting.codeyourfuture.io";

let lastTimestamp = 0;

// Show placeholder if no messages
function showPlaceholder() {
  const chatMessagesDiv = document.querySelector("#chat-messages");
  chatMessagesDiv.innerHTML = '';
  const placeholder = document.createElement('div');
  placeholder.className = "chat-placeholder";
  placeholder.textContent = "No messages yet. Start the conversation!";
  chatMessagesDiv.appendChild(placeholder);
}

//call identity on page load before any chat requests
async function ensureUserId() {
    await fetch(`${API_BASE_URL}/identity`, {
        method: 'POST',
        credentials: 'include'
    });
}

// Add a single message to the UI
function appendMessageToChat(msg) {
  const chatMessagesDiv = document.querySelector("#chat-messages");
  // Remove placeholder if present
  const placeholder = chatMessagesDiv.querySelector('.chat-placeholder');
  if (placeholder) chatMessagesDiv.removeChild(placeholder);

  const wrapper = document.createElement('div');
  wrapper.className = "chat-message-wrapper";

  const nameDiv = document.createElement('div');
  nameDiv.className = "chat-sender";
  nameDiv.textContent = msg.sender || "Anonymous";
  wrapper.appendChild(nameDiv);

  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = "chat-bubble";
  bubbleDiv.textContent = msg.message;
  wrapper.appendChild(bubbleDiv);

  chatMessagesDiv.appendChild(wrapper);
}

// Long-polling: fetch new messages and update UI
async function longPollMessages() {
  try {
    const url = lastTimestamp
      ? `${API_BASE_URL}/chat?since=${lastTimestamp}`
      : `${API_BASE_URL}/chat`;
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error('Error fetching chat');
    const newMessages = await response.json();

    if (newMessages.length > 0) {
      newMessages.forEach(msg => {
        appendMessageToChat(msg);
        lastTimestamp = Math.max(lastTimestamp, new Date(msg.timestamp).getTime());
      });
    } else if (document.querySelectorAll('.chat-message-wrapper').length === 0) {
      showPlaceholder();
    }
    //only start the next poll after this one finishes
    await longPollMessages();
  } catch (error) {
    showPlaceholder();
    console.error(error);
    //pause before retrying on error to avoid flooding
    setTimeout(longPollMessages, 2000);
  }
}

// Send a new chat message
async function addChatMessage(newMessage, senderName) {
  const backendURL = `${API_BASE_URL}/chat`;
  const userFeedbackDiv = document.getElementById('add-chat-message');
  userFeedbackDiv.textContent = '';
  userFeedbackDiv.classList.remove('add-chat-success', 'add-chat-error');

  try {
    const response = await fetch(backendURL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ message: newMessage, sender: senderName }),
      credentials: 'include'
    });

    if (response.ok) {
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

// Form submit handler
document.getElementById('add-message-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const newMessage = document.getElementById('new-message').value;
  const senderName = document.getElementById('sender-name').value;
  addChatMessage(newMessage, senderName);
  document.getElementById('new-message').value = '';
  document.getElementById('sender-name').value = '';
});

// On page load, show placeholder and start long-polling
window.addEventListener("load", async () => {
    await ensureUserId();
    showPlaceholder();
    longPollMessages();
});