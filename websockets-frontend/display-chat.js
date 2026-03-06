import { setUpClientWebSocket } from './websocket-client.js';
import { API_BASE_URL } from './config.js';

//tracks whether the WebSocket connection is currently open in the browser.
//the flag is used to decide whether to use WebSocket or fall back to long-polling.
let wsConnected = false;

//stores latest message timestamp to avoid duplicates
let lastTimestamp = 0;

let currentUserId = null;

let lastSenderId = null;

//this setter is called by the WebSocket client code.
//sets to true when the WebSocket connects & false when the WebSocket closes
function setWsConnectedValue(value) {
    wsConnected = value;
}


// Show placeholder if no messages/chat is empty
function showPlaceholder() {
  const chatMessagesDiv = document.querySelector("#chat-messages");
  chatMessagesDiv.innerHTML = '';
  const placeholder = document.createElement('div');
  placeholder.className = "chat-placeholder";
  placeholder.textContent = "No messages yet. Start the conversation!";
  chatMessagesDiv.appendChild(placeholder);
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
  //if the HTTP fetch method logs a message before the websocket it will ensure no duplicate message displayed
  //ignore messages older than lastTimestamp
  if (msg.timestamp <= lastTimestamp) return;

  //update the last timestamp immediately if the new message is actually newer, if older it stays the same
  lastTimestamp = Math.max(lastTimestamp, msg.timestamp)

  const chatMessagesDiv = document.querySelector("#chat-messages");

  // Remove placeholder if present
  const placeholder = chatMessagesDiv.querySelector('.chat-placeholder');
  if (placeholder) chatMessagesDiv.removeChild(placeholder);


  //create a message wrapper and add alignment classes
  const wrapper = document.createElement('div');
  const isOwnMessage = currentUserId && msg.userId === currentUserId;
  //add the correct user class to the message
  wrapper.className = `chat-message-wrapper ${isOwnMessage ? "own" : "other"}`;
  //access the message id in the new msg object and assign it to a 'data-message-id="<id>"' attribute in the div
  wrapper.dataset.messageId = msg.messageId

  //only show sender if different from previous message
  const showSender = lastSenderId !== msg.userId;
  lastSenderId = msg.userId;

  if (showSender) {
  const nameDiv = document.createElement('div');
  nameDiv.className = "chat-sender";
  nameDiv.textContent = msg.sender || "Anonymous";
  wrapper.appendChild(nameDiv);
  }

  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = "chat-bubble";
  bubbleDiv.style.color = msg.color
  bubbleDiv.textContent = msg.message;
  wrapper.appendChild(bubbleDiv);

  const likesDiv = document.createElement('div');
  likesDiv.className = "chat-likes";
  likesDiv.innerHTML = `
    <button class="like-btn">👍</button> <span class="like-count">${msg.likes || 0}</span>
    <button class="dislike-btn">👎</button> <span class="dislike-count">${msg.dislikes || 0}</span>
  `;
  wrapper.appendChild(likesDiv);

  chatMessagesDiv.appendChild(wrapper);

  //scroll to the bottom to show the latest message
  const chatDisplayDiv = document.querySelector("#chat-display");
  chatDisplayDiv.scrollTop = chatDisplayDiv.scrollHeight;
}


//fetch all the messages returned via HTTP fetch/long-poll since a specified time (here is 0)
async function fetchAndDisplayMessages(since = 0) {
  const url = since
    ? `${API_BASE_URL}/chat?since=${since}`
    : `${API_BASE_URL}/chat`;
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error('Error fetching chat');

  const newMessages = await response.json();

  if (newMessages.length > 0) {
    newMessages.forEach(msg => {appendMessageToChat(msg);});
  } else if (document.querySelectorAll('.chat-message-wrapper').length === 0) {
    showPlaceholder();
  }
  return newMessages;
}


// Long-polling: fetch new messages and update UI
async function longPollMessages() {

    //skip polling if webSocket is connected
    if (wsConnected) return;

  try {
    await fetchAndDisplayMessages(lastTimestamp)
    //only start the next poll after this one finishes
    await longPollMessages();
  } catch (error) {
    showPlaceholder();
    console.error(error);
    //pause before retrying on error to avoid flooding
    setTimeout(longPollMessages, 2000);
  }
}


//call identity on page load before any chat requests
async function ensureUserId() {
  const response = await fetch(`${API_BASE_URL}/identity`, {
    method: 'POST',
    credentials: 'include'
  });

  if (!response.ok) throw new Error("Failed to establish identity");
  const data = await response.json();
  currentUserId = data.userId;
}


// Send a new chat message
async function addChatMessage(newMessage, senderName, color) {
  const backendURL = `${API_BASE_URL}/chat`;
  const feedbackDiv = document.getElementById('add-chat-message');
  feedbackDiv.textContent = '';
  feedbackDiv.classList.remove('add-chat-success', 'add-chat-error');

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
document.getElementById('add-message-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const newMessage = document.getElementById('new-message').value;
  const senderName = document.getElementById('sender-name').value;
  const color = document.getElementById('color-picker').value;

  addChatMessage(newMessage, senderName, color);
  
  document.getElementById('new-message').value = '';
  document.getElementById('sender-name').value = '';
});


async function fetchInitialMessages() {
  try {
    await fetchAndDisplayMessages();
  } catch (error) {
    showPlaceholder();
    console.error(error);
  }
}

document.querySelector("#chat-messages").addEventListener("click", function(event) {
  if (event.target.classList.contains("like-btn") || event.target.classList.contains("dislike-btn")) {
    const wrapper = event.target.closest(".chat-message-wrapper");
    if (!wrapper) return;
    const messageId = wrapper.dataset.messageId;
    const action = event.target.classList.contains("like-btn") ? "like" : "dislike";
    sendLikeDislike(messageId, action);
  }
})

export function updateLikeDislikeUI(data) {
  const wrapper = document.querySelector(`.chat-message-wrapper[data-message-id="${data.messageId}"]`);
  if (!wrapper) return;
  const likeCount = wrapper.querySelector('.like-count');
  const dislikeCount = wrapper.querySelector('.dislike-count');
  if (likeCount) likeCount.textContent = data.likes;
  if (dislikeCount) dislikeCount.textContent = data.dislikes;
}

//send the like/dislike to backend
async function sendLikeDislike(messageId, action) {
  try {
    const response = await fetch(`${API_BASE_URL}/like`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify({ messageId, action}), 
    });
    if (!response.ok) {
      console.error("Failed to send like/dislike");
    }
    const data = await response.json();
  } catch (err) {
    console.error("Error sending like/dislike:", err);
  }
}

// On page load, show placeholder and start long-polling
window.addEventListener("load", async () => {
    await ensureUserId();
    showPlaceholder();
    await fetchInitialMessages()
    longPollMessages();
    //set up the WebSocket connection for receiving real-time messages.
    //pass appendMessageToChat to display messages over ws, and setWsConnectedValue to track connection status.
    setUpClientWebSocket(appendMessageToChat, setWsConnectedValue);
});