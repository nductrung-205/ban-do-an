import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ChefHat } from 'lucide-react';

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: 'Xin chào! Tôi là trợ lý ảo của Ẩm Thực Việt. Bạn cần hỗ trợ gì ạ?', sender: 'bot' }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);

    // URL của backend Laravel
    const API_CHAT_URL = `${import.meta.env.VITE_API_BASE_URL}/chat`;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (inputMessage.trim() === '') return;

        const newUserMessage = { text: inputMessage, sender: 'user' };
        setMessages((prevMessages) => [...prevMessages, newUserMessage]);
        setInputMessage('');

        const loadingMessage = { text: '...', sender: 'bot' };
        setMessages((prevMessages) => [...prevMessages, loadingMessage]);

        try {
            const chatHistory = messages.map(msg => ({
                sender: msg.sender,
                text: msg.text
            }));
            const filteredChatHistory = chatHistory.filter(msg => msg.text !== '...');

            const response = await fetch(API_CHAT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include', // Quan trọng cho CORS
                body: JSON.stringify({
                    message: newUserMessage.text,
                    chatHistory: filteredChatHistory
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            setMessages((prevMessages) => {
                const updatedMessages = prevMessages.filter(msg => msg.text !== '...');
                if (data.reply) {
                    return [...updatedMessages, { text: data.reply, sender: 'bot' }];
                } else if (data.error) {
                    return [...updatedMessages, { text: `Lỗi: ${data.error}`, sender: 'bot' }];
                }
                return updatedMessages;
            });

        } catch (error) {
            console.error("Lỗi chi tiết:", error);
            setMessages((prevMessages) => {
                const updatedMessages = prevMessages.filter(msg => msg.text !== '...');
                return [...updatedMessages, {
                    text: "Xin lỗi, hệ thống tạm thời không khả dụng. Vui lòng thử lại sau.",
                    sender: 'bot'
                }];
            });
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {isOpen && (
                <div className="w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 border-orange-100 animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                                <ChefHat className="w-6 h-6 text-orange-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Ẩm Thực Việt</h3>
                                <p className="text-orange-100 text-xs">Trợ lý ảo</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 hover:rotate-90"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-orange-50/30 to-white">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}
                            >
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${msg.sender === 'user'
                                        ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-br-sm'
                                        : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                                    }`}>
                                    {msg.text === '...' ? (
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    ) : (
                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Nhập tin nhắn của bạn..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all text-sm"
                            />
                            <button
                                onClick={handleSendMessage}
                                className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <Send className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Open Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group animate-in zoom-in-50"
                >
                    <MessageCircle className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                </button>
            )}
        </div>
    );
}

export default Chatbot;