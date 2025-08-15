document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatHistoryList = document.getElementById('chat-history-list');
    const newChatBtn = document.querySelector('.new-chat-btn');
    
    // Configuration - replace with your Groq API key
    const GROQ_API_KEY = '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';
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    
    // Initialize chat
    let currentChatId = Date.now().toString();
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    
    // Load chat history
    updateChatHistoryList();
    
    // Add initial bot message
    if (chatMessages.children.length === 0) {
        addBotMessage("Hello! I'm your Groq AI assistant. How can I help you today?");
    }
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    
    newChatBtn.addEventListener('click', startNewChat);
    
    // Function to send message
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        // Add user message to chat
        addUserMessage(message);
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            // Call Groq API
            const response = await fetchGroqResponse(message);
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add bot response to chat
            addBotMessage(response);
            
            // Save to chat history
            saveChatToHistory(message, response);
        } catch (error) {
            console.error('Error:', error);
            removeTypingIndicator();
            addBotMessage("Sorry, I encountered an error. Please try again.");
        }
    }
    
    // Function to call Groq API
    async function fetchGroqResponse(prompt) {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "mixtral-8x7b-32768",
                messages: [{role: "user", content: prompt}],
                temperature: 0.7,
                max_tokens: 1024
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }
    
    // Function to add user message
    function addUserMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.textContent = text;
        
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = getCurrentTime();
        
        messageElement.appendChild(contentElement);
        messageElement.appendChild(timeElement);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to add bot message
    function addBotMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.innerHTML = formatResponseText(text);
        
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = getCurrentTime();
        
        messageElement.appendChild(contentElement);
        messageElement.appendChild(timeElement);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Format response text (basic markdown support)
    function formatResponseText(text) {
        // Convert **bold** to <strong>bold</strong>
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Convert *italic* to <em>italic</em>
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Convert `code` to <code>code</code>
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');
        // Convert newlines to <br>
        text = text.replace(/\n/g, '<br>');
        return text;
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.className = 'typing-indicator';
        typingElement.id = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            typingElement.appendChild(dot);
        }
        
        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingElement = document.getElementById('typing-indicator');
        if (typingElement) {
            typingElement.remove();
        }
    }
    
    // Get current time in HH:MM format
    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Save chat to history
    function saveChatToHistory(userMessage, botResponse) {
        const chat = {
            id: currentChatId,
            title: userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : ''),
            timestamp: Date.now(),
            messages: [
                { role: 'user', content: userMessage },
                { role: 'assistant', content: botResponse }
            ]
        };
        
        // Check if this chat already exists in history
        const existingChatIndex = chatHistory.findIndex(c => c.id === currentChatId);
        
        if (existingChatIndex !== -1) {
            // Append messages to existing chat
            chatHistory[existingChatIndex].messages.push(
                { role: 'user', content: userMessage },
                { role: 'assistant', content: botResponse }
            );
            chatHistory[existingChatIndex].title = userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : '');
        } else {
            // Add new chat to history
            chatHistory.unshift(chat);
        }
        
        // Keep only the last 20 chats
        if (chatHistory.length > 20) {
            chatHistory = chatHistory.slice(0, 20);
        }
        
        // Save to localStorage
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        
        // Update chat history list
        updateChatHistoryList();
    }
    
    // Update chat history list in sidebar
    function updateChatHistoryList() {
        chatHistoryList.innerHTML = '';
        
        chatHistory.forEach(chat => {
            const li = document.createElement('li');
            li.textContent = chat.title;
            li.addEventListener('click', () => loadChat(chat.id));
            chatHistoryList.appendChild(li);
        });
    }
    
    // Load a specific chat
    function loadChat(chatId) {
        currentChatId = chatId;
        const chat = chatHistory.find(c => c.id === chatId);
        
        if (chat) {
            // Clear current messages
            chatMessages.innerHTML = '';
            
            // Add all messages from the chat
            chat.messages.forEach(msg => {
                if (msg.role === 'user') {
                    addUserMessage(msg.content);
                } else {
                    addBotMessage(msg.content);
                }
            });
        }
    }
    
    // Start a new chat
    function startNewChat() {
        currentChatId = Date.now().toString();
        chatMessages.innerHTML = '';
        addBotMessage("Hello! I'm your Groq AI assistant. How can I help you today?");
    }
});
