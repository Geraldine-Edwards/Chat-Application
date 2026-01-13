async function fetchAndDisplayChatMessages() {
    try {
        const response = await fetch('http://localhost:3000/chat');
        if (!response.ok) throw new Error('Error fetching chat')
            const data = await response.json()

        document.querySelector("#chat-messages").innerHTML = data.map(msg => `<div class="chat-bubble">${msg.message}</div>`).join('\n');
    } catch (error) {
        document.querySelector("#chat-messages").innerText = "Sorry could not load chat"
        console.error(error)
    }
}

// show the current chat when the page loads
window.addEventListener("load", fetchAndDisplayChatMessages)


// async function addChatMessage() {
//     try {

//     } catch (error) {

//     }
// }

// // add a submit handler to the form
// document.getElementById('add-message-form').addEventListener('submit', function(event) {
//     event.preventDefault()

// });
