# Chat Application

## Coursework Link

[https://sdc.codeyourfuture.io/decomposition/sprints/2/prep/](https://sdc.codeyourfuture.io/decomposition/sprints/2/prep/)

---

## Project Brief

You must complete and deploy a chat application. You have two weeks to complete this.

### Requirements

- As a user, I can add a message to the chat.
- As a user, when I open the chat I see the messages that have been sent by any user.
- As a user, when someone sends a message, it gets added to what I see.
- It must also support at least one additional feature.

### Why are we doing this?

- Learning about deploying multiple pieces of software that interact.
- Designing and implementing working software that users can use.
- Exploring and understanding different ways of sending information between a client and server.

**Maximum time in hours:** 16

---

## How to Submit

Add as a comment to your copy of this issue:

- A link to the GitHub repository for your chat application frontend and backend
- A link to the deployed frontend on the CYF hosting environment
- A link to the deployed backend on the CYF hosting environment

---
<br>
<br>
<br>

# My Implementation & Progress

## Phase 1: Must Have Features

### 1. User can send a message to the chat
- [x] Created `POST /chat` endpoint in backend
- [x] Added message submission form in frontend
- [x] Connected frontend form to backend endpoint
- [x] Display new message in chat after sending

### 2. User can see all messages when opening the chat
- [x] Created `GET /chat` endpoint in backend
- [x] Fetch messages on frontend page load
- [x] Display messages in chat area

### 3. Messages sent by any user are visible to all users
- [x] Store all messages in backend
- [x] Ensure frontend updates chat display after new message is sent
- [x] Implemented auto-refresh (polling) for live updates

---

_Phase 1 complete! The core chat functionality is working as required._

---

## Phase 2: WebSocket Real-Time Updates

### 4. Real-time chat with WebSockets
- [x] Added a WebSocket server to the backend, attached to the HTTP server
- [x] Implemented origin checks for WebSocket security
- [x] On new message (via HTTP POST), broadcast to all connected WebSocket clients
- [x] Created a WebSocket client in the frontend
- [x] On page load, fetch initial chat history via HTTP, then connect to WebSocket for real-time updates
- [x] Display incoming messages instantly in the chat UI
- [x] Fallback to long-polling if WebSocket is not connected (using a `wsConnected` flag)
- [x] Provided user feedback for connection errors and message status

---

## Technical Details

- **Backend:** Node.js/Express, with in-memory message storage, unique ID and timestamp generation, input sanitization, and WebSocket server for real-time updates.
- **Frontend:** Vanilla JavaScript, fetches all messages on load, then uses WebSocket for real-time updates (with long-polling fallback).
- **Security:** All user input is sanitized on the backend to prevent XSS attacks. WebSocket connections are origin-checked.
- **User Experience:** Color-coded messages, sender names, and clear feedback for message status and connection issues.

---

## Next Steps / Possible Improvements

- Add persistent storage (e.g., a database) for messages.
- Implement user identification (e.g., anonymous user IDs stored in cookies).
- Enhance the UI/UX for a better chat experience.
- Add more advanced features (e.g., message editing, deleting, or notifications).

---
