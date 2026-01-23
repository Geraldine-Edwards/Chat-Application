import { setUpClientWebSocket } from './websocket-client.js';
import { API_BASE_URL } from './config.js';

//tracks whether the WebSocket connection is currently open in the browser.
//the flag is used to decide whether to use WebSocket or fall back to long-polling.
let wsConnected = false;

//this setter is called by the WebSocket client code.
//sets to true when the WebSocket connects & false when the WebSocket closes
function setWsConnectedValue(value) {
    wsConnected = value;
}

//set up the WebSocket connection for receiving real-time messages.
//pass appendMessageToChat to display messages over ws, and setWsConnectedValue to track connection status.
setUpClientWebSocket(appendMessageToChat, setWsConnectedValue);



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

function showUserFeedback(message, type, timeout = 8000) {
  const userFeedbackDiv = document.getElementById('add-chat-message');
  userFeedbackDiv.textContent = message;
  userFeedbackDiv.classList.remove('add-chat-success', 'add-chat-error');
  if (type === 'success') {
    userFeedbackDiv.classList.add('add-chat-success');
  } else if (type === 'error') {
    userFeedbackDiv.classList.add('add-chat-error');
  }
  setTimeout(() => {
    userFeedbackDiv.textContent = '';
    userFeedbackDiv.classList.remove('add-chat-success', 'add-chat-error');
  }, timeout);
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
  bubbleDiv.style.color = msg.color || "#000000"
  wrapper.appendChild(bubbleDiv);

  chatMessagesDiv.appendChild(wrapper);
}

// Long-polling: fetch new messages and update UI
async function longPollMessages() {

    //skip polling if webSocket is connected
    if (wsConnected) return;

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
async function addChatMessage(newMessage, senderName, color) {
  const backendURL = `${API_BASE_URL}/chat`;
  const userFeedbackDiv = document.getElementById('add-chat-message');
  userFeedbackDiv.textContent = '';
  userFeedbackDiv.classList.remove('add-chat-success', 'add-chat-error');

  try {
    const response = await fetch(backendURL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ message: newMessage, sender: senderName, color }),
      credentials: 'include'
    });

    if (response.ok) {
      showUserFeedback('Message sent!', 'success');
    } else {
      const data = await response.json();
      showUserFeedback(data.error || 'Failed to send message.', 'error');
     
    }
  } catch (error) {
    showUserFeedback('Network error. Please try again.', 'error', 10000);
    console.error(error);
  }
}

// Form submit handler
document.getElementById('add-message-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const newMessage = document.getElementById('new-message').value;
  const senderName = document.getElementById('sender-name').value;
  const color = document.getElementById('color-picker').value;
  addChatMessage(newMessage, senderName, color);
  document.getElementById('new-message').value = '';
  document.getElementById('sender-name').value = '';
});

// On page load, show placeholder and start long-polling
window.addEventListener("load", async () => {
    await ensureUserId();
    showPlaceholder();
    longPollMessages();
});