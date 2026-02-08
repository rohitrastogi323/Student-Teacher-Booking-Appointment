/**
 * AI Assistant Module for Student-Teacher Booking System
 * Provides intelligent features like smart recommendations,
 * chat assistance, sentiment analysis, and predictive analytics
 */

const AIAssistant = (function() {
    'use strict';

    // AI Configuration
    const AI_CONFIG = {
        version: '1.0.0',
        features: {
            chatAssistant: true,
            smartRecommendations: true,
            sentimentAnalysis: true,
            autoComplete: true,
            predictiveScheduling: true
        }
    };

    /**
     * Initialize AI Assistant
     */
    function initialize() {
        Logger.info('AI', 'AI Assistant initialized', { version: AI_CONFIG.version });
        
        // Add AI widget to all pages
        addAIWidget();
        
        // Initialize features based on current page
        initializePageSpecificFeatures();
    }

    /**
     * Add AI Chat Widget to all pages
     */
    function addAIWidget() {
        // Check if widget already exists
        if (document.getElementById('ai-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'ai-widget';
        widget.innerHTML = `
            <div id="ai-chat-container" style="display: none;">
                <div id="ai-chat-header">
                    <i class="fas fa-robot"></i>
                    <span>AI Assistant</span>
                    <button id="ai-close-btn" onclick="AIAssistant.toggleChat()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="ai-chat-messages"></div>
                <div id="ai-chat-input-container">
                    <input type="text" id="ai-chat-input" placeholder="Ask me anything..." 
                           onkeypress="if(event.key==='Enter')AIAssistant.sendMessage()">
                    <button onclick="AIAssistant.sendMessage()">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            <div id="ai-toggle-btn" onclick="AIAssistant.toggleChat()">
                <i class="fas fa-robot"></i>
                <span class="ai-notification-badge" id="ai-badge" style="display: none;">1</span>
            </div>
        `;
        
        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            #ai-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                font-family: 'Poppins', sans-serif;
            }
            
            #ai-toggle-btn {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
                font-size: 1.5rem;
                position: relative;
            }
            
            #ai-toggle-btn:hover {
                transform: scale(1.1);
            }
            
            .ai-notification-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ef4444;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                font-weight: bold;
            }
            
            #ai-chat-container {
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: aiSlideIn 0.3s ease;
            }
            
            @keyframes aiSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            #ai-chat-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 600;
            }
            
            #ai-chat-header button {
                margin-left: auto;
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 1rem;
            }
            
            #ai-chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
                background: #f8f9fa;
            }
            
            .ai-message {
                margin-bottom: 15px;
                max-width: 80%;
                padding: 12px 15px;
                border-radius: 15px;
                font-size: 0.9rem;
                line-height: 1.4;
                animation: messageSlide 0.3s ease;
            }
            
            @keyframes messageSlide {
                from {
                    opacity: 0;
                    transform: translateX(10px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .ai-message.user {
                background: #667eea;
                color: white;
                margin-left: auto;
                border-bottom-right-radius: 5px;
            }
            
            .ai-message.bot {
                background: white;
                color: #333;
                margin-right: auto;
                border-bottom-left-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            
            .ai-message.typing {
                background: white;
                color: #999;
                font-style: italic;
            }
            
            #ai-chat-input-container {
                display: flex;
                padding: 15px;
                background: white;
                border-top: 1px solid #e5e7eb;
                gap: 10px;
            }
            
            #ai-chat-input {
                flex: 1;
                padding: 10px 15px;
                border: 2px solid #e5e7eb;
                border-radius: 25px;
                outline: none;
                font-family: inherit;
            }
            
            #ai-chat-input:focus {
                border-color: #667eea;
            }
            
            #ai-chat-input-container button {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #667eea;
                color: white;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .ai-quick-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 10px;
            }
            
            .ai-quick-action {
                padding: 6px 12px;
                background: rgba(102, 126, 234, 0.1);
                color: #667eea;
                border: 1px solid #667eea;
                border-radius: 15px;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .ai-quick-action:hover {
                background: #667eea;
                color: white;
            }
            
            .ai-suggestion-card {
                background: white;
                border-radius: 10px;
                padding: 12px;
                margin-top: 10px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border-left: 4px solid #667eea;
            }
            
            .ai-suggestion-card h4 {
                margin: 0 0 8px 0;
                color: #667eea;
                font-size: 0.9rem;
            }
            
            .ai-suggestion-card p {
                margin: 0;
                font-size: 0.85rem;
                color: #666;
            }
            
            @media (max-width: 480px) {
                #ai-chat-container {
                    width: calc(100vw - 40px);
                    height: 60vh;
                    right: -10px;
                }
            }
        `;
        
        document.head.appendChild(styles);
        document.body.appendChild(widget);
        
        // Add welcome message
        setTimeout(() => {
            addBotMessage(getWelcomeMessage());
        }, 1000);
    }

    /**
     * Get welcome message based on current page
     */
    function getWelcomeMessage() {
        const path = window.location.pathname;
        const user = getCurrentUser();
        
        let message = "👋 Hi! I'm your AI Assistant. ";
        
        if (user) {
            message += `Welcome back, ${user.name}! `;
            
            if (user.role === 'student') {
                message += "I can help you find teachers, book appointments, or answer questions about the system.";
            } else if (user.role === 'teacher') {
                message += "I can help you manage your schedule, view analytics, or assist with student queries.";
            } else if (user.role === 'admin') {
                message += "I can help you manage the system, view reports, or assist with administrative tasks.";
            }
        } else {
            message += "I can help you navigate the system, find teachers, or answer any questions you have.";
        }
        
        return message;
    }

    /**
     * Toggle chat widget visibility
     */
    function toggleChat() {
        const container = document.getElementById('ai-chat-container');
        const badge = document.getElementById('ai-badge');
        
        if (container.style.display === 'none') {
            container.style.display = 'flex';
            badge.style.display = 'none';
        } else {
            container.style.display = 'none';
        }
    }

    /**
     * Send user message
     */
    function sendMessage() {
        const input = document.getElementById('ai-chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        addUserMessage(message);
        input.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Process message and respond
        setTimeout(() => {
            removeTypingIndicator();
            const response = processMessage(message);
            addBotMessage(response.message, response.suggestions);
        }, 1000 + Math.random() * 1000); // Simulate thinking time
        
        Logger.info('AI', 'User message sent', { message: message });
    }

    /**
     * Add user message to chat
     */
    function addUserMessage(text) {
        const container = document.getElementById('ai-chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message user';
        messageDiv.textContent = text;
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Add bot message to chat
     */
    function addBotMessage(text, suggestions = []) {
        const container = document.getElementById('ai-chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message bot';
        messageDiv.innerHTML = text;
        
        // Add quick action buttons if suggestions provided
        if (suggestions.length > 0) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'ai-quick-actions';
            
            suggestions.forEach(suggestion => {
                const btn = document.createElement('button');
                btn.className = 'ai-quick-action';
                btn.textContent = suggestion.text;
                btn.onclick = () => {
                    document.getElementById('ai-chat-input').value = suggestion.action;
                    sendMessage();
                };
                actionsDiv.appendChild(btn);
            });
            
            messageDiv.appendChild(actionsDiv);
        }
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Show typing indicator
     */
    function showTypingIndicator() {
        const container = document.getElementById('ai-chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'ai-typing';
        typingDiv.className = 'ai-message bot typing';
        typingDiv.innerHTML = '<i class="fas fa-circle" style="animation: pulse 1s infinite;"></i> Thinking...';
        container.appendChild(typingDiv);
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Remove typing indicator
     */
    function removeTypingIndicator() {
        const typing = document.getElementById('ai-typing');
        if (typing) typing.remove();
    }

    /**
     * Process user message and generate response
     */
    function processMessage(message) {
        const lowerMsg = message.toLowerCase();
        const user = getCurrentUser();
        
        // Intent detection
        if (lowerMsg.includes('book') || lowerMsg.includes('appointment') || lowerMsg.includes('schedule')) {
            return {
                message: "📅 I can help you book an appointment! Here are your options:",
                suggestions: [
                    { text: "Find Teachers", action: "How do I find teachers?" },
                    { text: "My Bookings", action: "Show my bookings" },
                    { text: "Book Now", action: "I want to book an appointment" }
                ]
            };
        }
        
        if (lowerMsg.includes('teacher') || lowerMsg.includes('find') || lowerMsg.includes('search')) {
            if (user && user.role === 'student') {
                return {
                    message: "🔍 You can search for teachers by department, subject, or name. Would you like me to help you find a teacher?",
                    suggestions: [
                        { text: "Search Teachers", action: "Take me to search" },
                        { text: "Computer Science", action: "Find CS teachers" },
                        { text: "Mathematics", action: "Find Math teachers" }
                    ]
                };
            }
        }
        
        if (lowerMsg.includes('message') || lowerMsg.includes('chat') || lowerMsg.includes('contact')) {
            return {
                message: "💬 You can send messages to teachers or view your conversations. What would you like to do?",
                suggestions: [
                    { text: "View Messages", action: "Show my messages" },
                    { text: "Send Message", action: "I want to send a message" }
                ]
            };
        }
        
        if (lowerMsg.includes('help') || lowerMsg.includes('how') || lowerMsg.includes('what')) {
            return {
                message: "❓ Here are some things I can help you with:",
                suggestions: [
                    { text: "Book Appointment", action: "How to book appointment?" },
                    { text: "Find Teacher", action: "How to find teachers?" },
                    { text: "View Schedule", action: "How to check my schedule?" },
                    { text: "Send Message", action: "How to send messages?" }
                ]
            };
        }
        
        if (lowerMsg.includes('dashboard') || lowerMsg.includes('home') || lowerMsg.includes('back')) {
            return {
                message: "🏠 I'll take you to your dashboard where you can see all your information and activities.",
                suggestions: [
                    { text: "Go to Dashboard", action: "Open my dashboard" }
                ]
            };
        }
        
        if (lowerMsg.includes('logout') || lowerMsg.includes('sign out') || lowerMsg.includes('exit')) {
            return {
                message: "👋 Are you sure you want to logout?",
                suggestions: [
                    { text: "Yes, Logout", action: "Logout now" },
                    { text: "No, Stay", action: "Cancel logout" }
                ]
            };
        }
        
        // Default response
        return {
            message: "🤔 I'm not sure I understood. Here are some things I can help with:",
            suggestions: [
                { text: "Book Appointment", action: "How do I book an appointment?" },
                { text: "Find Teachers", action: "How do I find teachers?" },
                { text: "View Messages", action: "How do I view messages?" },
                { text: "Get Help", action: "Help me with the system" }
            ]
        };
    }

    /**
     * Initialize page-specific AI features
     */
    function initializePageSpecificFeatures() {
        const path = window.location.pathname;
        
        if (path.includes('search.html')) {
            initializeSmartRecommendations();
        } else if (path.includes('dashboard.html')) {
            initializePredictiveAnalytics();
        } else if (path.includes('messages.html')) {
            initializeSmartReply();
        }
    }

    /**
     * Smart Teacher Recommendations for Students
     */
    function initializeSmartRecommendations() {
        const user = getCurrentUser();
        if (!user || user.role !== 'student') return;
        
        // Analyze student's department and suggest teachers
        const recommendations = generateTeacherRecommendations(user);
        
        if (recommendations.length > 0) {
            showRecommendationCard(recommendations);
        }
    }

    /**
     * Generate teacher recommendations based on student profile
     */
    function generateTeacherRecommendations(student) {
        const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
        const bookings = JSON.parse(localStorage.getItem('appointments') || '[]');
        
        // Filter teachers in same department
        let recommended = teachers.filter(t => 
            t.department === student.department && 
            t.status === 'active'
        );
        
        // Sort by popularity (number of bookings)
        recommended.sort((a, b) => {
            const aBookings = bookings.filter(booking => booking.teacherId === a.id).length;
            const bBookings = bookings.filter(booking => booking.teacherId === b.id).length;
            return bBookings - aBookings;
        });
        
        return recommended.slice(0, 3); // Top 3 recommendations
    }

    /**
     * Show recommendation card
     */
    function showRecommendationCard(teachers) {
        const container = document.querySelector('.main-content');
        if (!container) return;
        
        const card = document.createElement('div');
        card.className = 'card ai-recommendation';
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title"><i class="fas fa-magic"></i> AI Recommended Teachers</h3>
                <span class="badge badge-primary">Based on your department</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                ${teachers.map(teacher => `
                    <div class="ai-suggestion-card">
                        <h4>${teacher.name}</h4>
                        <p><strong>Subject:</strong> ${teacher.subject}</p>
                        <p><strong>Department:</strong> ${teacher.department}</p>
                        <button class="btn btn-sm btn-primary" onclick="quickBook('${teacher.id}')" style="margin-top: 8px;">
                            <i class="fas fa-calendar-plus"></i> Book Now
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Insert after page header
        const pageHeader = container.querySelector('.page-header');
        if (pageHeader) {
            pageHeader.insertAdjacentElement('afterend', card);
        }
        
        Logger.info('AI', 'Teacher recommendations displayed', { count: teachers.length });
    }

    /**
     * Predictive Analytics for Dashboard
     */
    function initializePredictiveAnalytics() {
        const user = getCurrentUser();
        if (!user) return;
        
        const analytics = generatePredictiveAnalytics(user);
        showAnalyticsWidget(analytics);
    }

    /**
     * Generate predictive analytics
     */
    function generatePredictiveAnalytics(user) {
        const bookings = JSON.parse(localStorage.getItem('appointments') || '[]');
        const userBookings = bookings.filter(b => b.studentId === user.id || b.teacherId === user.id);
        
        // Calculate trends
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        
        const recentBookings = userBookings.filter(b => new Date(b.date) >= lastMonth);
        const approvedBookings = recentBookings.filter(b => b.status === 'approved').length;
        const pendingBookings = recentBookings.filter(b => b.status === 'pending').length;
        
        // Predictions
        const predictions = {
            trend: recentBookings.length > 5 ? 'high' : recentBookings.length > 2 ? 'medium' : 'low',
            suggestedAction: pendingBookings > 2 ? 'You have multiple pending appointments. Consider following up.' : 
                           approvedBookings > 5 ? 'Great engagement! You\'re actively using the system.' :
                           'Consider booking more appointments to maximize your learning.',
            nextBestTime: suggestBestBookingTime(userBookings),
            successRate: userBookings.length > 0 ? 
                Math.round((userBookings.filter(b => b.status === 'approved').length / userBookings.length) * 100) : 0
        };
        
        return predictions;
    }

    /**
     * Suggest best booking time based on history
     */
    function suggestBestBookingTime(bookings) {
        if (bookings.length === 0) return 'Morning (9 AM - 12 PM)';
        
        // Analyze preferred times
        const hourCounts = {};
        bookings.forEach(b => {
            const hour = parseInt(b.startTime.split(':')[0]);
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        const preferredHour = Object.keys(hourCounts).reduce((a, b) => 
            hourCounts[a] > hourCounts[b] ? a : b
        );
        
        if (preferredHour < 12) return 'Morning (9 AM - 12 PM)';
        if (preferredHour < 17) return 'Afternoon (12 PM - 5 PM)';
        return 'Evening (5 PM - 8 PM)';
    }

    /**
     * Show analytics widget
     */
    function showAnalyticsWidget(analytics) {
        const container = document.querySelector('.main-content');
        if (!container) return;
        
        const widget = document.createElement('div');
        widget.className = 'card ai-analytics';
        widget.innerHTML = `
            <div class="card-header">
                <h3 class="card-title"><i class="fas fa-brain"></i> AI Insights</h3>
                <span class="badge badge-success">Personalized for You</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div class="ai-suggestion-card">
                    <h4><i class="fas fa-chart-line"></i> Activity Trend</h4>
                    <p>${analytics.trend === 'high' ? '🔥 High' : analytics.trend === 'medium' ? '📈 Medium' : '📉 Low'} engagement this month</p>
                </div>
                <div class="ai-suggestion-card">
                    <h4><i class="fas fa-clock"></i> Best Time for You</h4>
                    <p>${analytics.nextBestTime}</p>
                </div>
                <div class="ai-suggestion-card">
                    <h4><i class="fas fa-check-circle"></i> Success Rate</h4>
                    <p>${analytics.successRate}% of your bookings are approved</p>
                </div>
            </div>
            <div class="ai-suggestion-card" style="margin-top: 1rem;">
                <h4><i class="fas fa-lightbulb"></i> AI Suggestion</h4>
                <p>${analytics.suggestedAction}</p>
            </div>
        `;
        
        // Insert at beginning of main content
        const firstCard = container.querySelector('.card');
        if (firstCard) {
            firstCard.insertAdjacentElement('beforebegin', widget);
        }
        
        Logger.info('AI', 'Predictive analytics displayed', analytics);
    }

    /**
     * Smart Reply Suggestions for Messages
     */
    function initializeSmartReply() {
        const chatInput = document.getElementById('replyMessage') || document.getElementById('messageContent');
        if (!chatInput) return;
        
        // Add smart reply buttons
        const smartReplies = document.createElement('div');
        smartReplies.id = 'smart-replies';
        smartReplies.className = 'ai-quick-actions';
        smartReplies.style.marginBottom = '10px';
        smartReplies.innerHTML = `
            <span style="font-size: 0.8rem; color: #666; margin-right: 5px;">Smart Replies:</span>
            <button class="ai-quick-action" onclick="AIAssistant.insertSmartReply('Thank you for your time.')">Thanks</button>
            <button class="ai-quick-action" onclick="AIAssistant.insertSmartReply('Can we reschedule to another time?')">Reschedule</button>
            <button class="ai-quick-action" onclick="AIAssistant.insertSmartReply('I have a question about...')">Question</button>
            <button class="ai-quick-action" onclick="AIAssistant.insertSmartReply('See you at the appointment!')">Confirm</button>
        `;
        
        chatInput.parentElement.insertBefore(smartReplies, chatInput);
    }

    /**
     * Insert smart reply
     */
    function insertSmartReply(text) {
        const chatInput = document.getElementById('replyMessage') || document.getElementById('messageContent');
        if (chatInput) {
            chatInput.value = text;
            chatInput.focus();
        }
    }

    /**
     * Sentiment Analysis for Messages
     */
    function analyzeSentiment(text) {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'thank', 'thanks', 'appreciate', 'helpful', 'best'];
        const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'disappointed', 'frustrated', 'angry', 'problem', 'issue'];
        
        const lowerText = text.toLowerCase();
        let score = 0;
        
        positiveWords.forEach(word => {
            if (lowerText.includes(word)) score++;
        });
        
        negativeWords.forEach(word => {
            if (lowerText.includes(word)) score--;
        });
        
        if (score > 0) return { sentiment: 'positive', score: score };
        if (score < 0) return { sentiment: 'negative', score: score };
        return { sentiment: 'neutral', score: 0 };
    }

    /**
     * Auto-complete suggestions for search
     */
    function getSearchSuggestions(query) {
        const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
        const subjects = [...new Set(teachers.map(t => t.subject))];
        const departments = [...new Set(teachers.map(t => t.department))];
        
        const allSuggestions = [
            ...subjects,
            ...departments,
            ...teachers.map(t => t.name)
        ];
        
        return allSuggestions.filter(s => 
            s.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
    }

    // Public API
    return {
        initialize: initialize,
        toggleChat: toggleChat,
        sendMessage: sendMessage,
        insertSmartReply: insertSmartReply,
        analyzeSentiment: analyzeSentiment,
        getSearchSuggestions: getSearchSuggestions,
        config: AI_CONFIG
    };
})();

// Initialize AI Assistant when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        if (typeof AIAssistant !== 'undefined') {
            AIAssistant.initialize();
        }
    }, 500);
});

// Make AIAssistant available globally
window.AIAssistant = AIAssistant;
