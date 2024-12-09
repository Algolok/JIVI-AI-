// Flag to track if a request is in progress
let isRequestInProgress = false;
let currentAbortController = null;  // Store the current abort controller to handle cancellation

// Function to send a message to the locally running Mistral model and get a response
async function getChatbotResponse(userInput) {
    try {
        // Check if a request is already in progress, prevent further submissions
        if (isRequestInProgress) {
            return;
        }

        // Create a new AbortController to allow cancellation of the fetch request
        currentAbortController = new AbortController();
        const signal = currentAbortController.signal;

        isRequestInProgress = true;

        const response = await fetch('http://localhost:11434/v1/chat/completions', {  // Local Ollama server endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: signal,
            body: JSON.stringify({
                model: 'mistral',
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful AI assistant designed to provide clear, concise, and informative responses. Your main goal is to deliver accurate information to users, ensuring that they receive the most relevant and useful details. For general inquiries, you aim to give the shortest and most straightforward answers. When a user requests a list, you respond by presenting the information in JSON format for easy consumption. Additionally, you are capable of understanding and responding in multiple languages, adapting to the user's language preference. You use context and previous interactions to provide answers that are tailored to the user's needs, making the conversation more relevant and personalized. You maintain a friendly and respectful tone in your dialogues, and you actively engage users by asking thoughtful questions that encourage further conversation. You also have the ability to search for up-to-date information to ensure that your answers are current. Lastly, you always direct users to Microsoft's privacy statement, providing them with important information about how their data is used.`
                    },
                    {
                        role: 'user',
                        content: userInput
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error('Error: Unable to get response from local Ollama server');
        }

        const data = await response.json();
        console.log('Generated Response:', data);

        return data.choices[0].message.content || 'Sorry, I didn\'t understand that.';
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Request was canceled.');
            return 'Request was canceled.';
        }
        console.error('Error:', error);
        return 'An error occurred while trying to get a response from the model.';
    } finally {
        isRequestInProgress = false;  // Reset the flag when done
        document.getElementById('sendButton').disabled = false;  // Re-enable the send button
        document.getElementById('cancelButton').style.display = 'none';  // Hide the cancel button
    }
}

// Function to append messages to the chat container
function appendMessage(content, isUser = false) {
    const messageContainer = document.createElement('div');
    if (isUser) {
        messageContainer.classList.add('p-2', 'mb-2', 'rounded-lg', 'bg-blue-500', 'text-white');
    } else {
        messageContainer.classList.add('p-2', 'mb-2', 'rounded-lg', 'bg-gray-700', 'text-white');
    }
    messageContainer.textContent = content;
    document.getElementById('chatContainer').appendChild(messageContainer);
    document.getElementById('chatContainer').scrollTop = document.getElementById('chatContainer').scrollHeight;
}

// Function to handle form submission
document.getElementById('chatForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userInput = document.getElementById('userMessage').value.trim();

    if (userInput === '' || isRequestInProgress) return;

    // Display the user's message
    appendMessage(userInput, true);

    // Disable the send button and show the cancel button
    document.getElementById('sendButton').disabled = true;
    document.getElementById('cancelButton').style.display = 'inline-block';

    // Clear the input field
    document.getElementById('userMessage').value = '';

    // Send the message to the chatbot and display the response
    try {
        const botResponse = await getChatbotResponse(userInput);
        appendMessage(botResponse, false);
    } catch (error) {
        appendMessage(error, false);
    }
});

// Cancel button functionality
document.getElementById('cancelButton').addEventListener('click', () => {
    if (currentAbortController) {
        currentAbortController.abort();  // Cancel the ongoing request
    }
});












