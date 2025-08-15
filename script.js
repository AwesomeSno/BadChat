document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    // Replace with your actual API key and endpoint
    const API_KEY = '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';
    const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    
    // Add event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Initial greeting
    addBotMessage("Hello! How can I help you today?");
    
    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        // Add user message to chat
        addUserMessage(message);
        userInput.value = '';
        
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.textContent = 'AI is typing...';
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Call the API
        fetchAIResponse(message)
            .then(response => {
                // Remove typing indicator
                chatMessages.removeChild(typingIndicator);
                
                // Add bot response to chat
                addBotMessage(response);
            })
            .catch(error => {
                console.error('Error:', error);
                chatMessages.removeChild(typingIndicator);
                addBotMessage("Sorry, I encountered an error. Please try again.");
            });
    }
    
    async function fetchAIResponse(prompt) {
        // For OpenAI API (you'll need to sign up and get an API key)
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{role: "user", content: prompt}],
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        return data.choices[0].message.content;
        
        // For other APIs, you would adjust this function accordingly
    }
    
    function addUserMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function addBotMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
