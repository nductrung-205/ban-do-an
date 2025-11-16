import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ChefHat } from 'lucide-react';

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    // Lưu ý: chatHistory sẽ lưu trữ theo định dạng của Gemini API (role, parts)
    const [chatHistory, setChatHistory] = useState([

        { role: 'model', parts: [{ text: 'Xin chào! Tôi là trợ lý ảo của Ẩm Thực Việt. Bạn cần hỗ trợ gì ạ? 😋' }] }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Trạng thái loading
    const messagesEndRef = useRef(null);

    // URL của backend Laravel
    const API_CHAT_URL = `${import.meta.env.VITE_API_BASE_URL}/chat`;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); // block: "end" đảm bảo cuộn đến cuối cùng
    };

    // Cuộn xuống dưới mỗi khi messages hoặc isLoading thay đổi
    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isLoading]);

    // Lọc ra các tin nhắn hiển thị cho người dùng từ chatHistory
    const displayedMessages = chatHistory.flatMap((msg, msgIndex) => {
        if (!msg.parts) return [];

        const messagesFromParts = [];

        msg.parts.forEach((part, partIndex) => {
            // Bỏ qua functionResponse
            if (part.functionResponse) return;

            // Xử lý hình ảnh
            if (part.type === 'image' && part.url) {
                messagesFromParts.push({
                    key: `${msgIndex}-${partIndex}-image`,
                    type: 'image',
                    url: part.url,
                    alt: part.text || 'Hình ảnh món ăn',
                    sender: msg.role === 'user' ? 'user' : 'bot'
                });
            }
            // Xử lý text
            else if (part.text) {
                messagesFromParts.push({
                    key: `${msgIndex}-${partIndex}-text`,
                    type: 'text',
                    text: part.text,
                    sender: msg.role === 'user' ? 'user' : 'bot'
                });
            }
        });

        return messagesFromParts;
    });


    const handleSendMessage = async () => {
        if (inputMessage.trim() === '') return;

        const userMessage = inputMessage.trim();
        setIsLoading(true); // Bắt đầu loading

        // Thêm tin nhắn của người dùng vào lịch sử trò chuyện theo định dạng Gemini
        const newUserMessagePayload = { role: 'user', parts: [{ text: userMessage }] };
        setChatHistory((prevHistory) => [...prevHistory, newUserMessagePayload]);
        setInputMessage(''); // Xóa input ngay lập tức

        try {
            // Gửi toàn bộ chatHistory (trừ system instruction ban đầu, backend sẽ tự thêm)
            // Lọc bỏ tin nhắn chào mừng ban đầu nếu nó chỉ là một placeholder ở frontend
            const historyToSend = chatHistory.filter(msg =>
                msg.role !== 'model' || (msg.parts && msg.parts[0]?.text !== 'Xin chào! Tôi là trợ lý ảo của Ẩm Thực Việt. Bạn cần hỗ trợ gì ạ? 😋')
            );


            const response = await fetch(API_CHAT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include', // Quan trọng cho CORS nếu có session/cookie
                body: JSON.stringify({
                    message: userMessage, // Tin nhắn mới của user
                    chatHistory: historyToSend // Lịch sử trò chuyện trước đó
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Không thể phân tích lỗi từ server.' }));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Cập nhật lịch sử trò chuyện với phản hồi từ bot
            setChatHistory((prevHistory) => {
                const updatedHistory = [...prevHistory];
                if (data.reply) {
                    const newBotMessage = {
                        role: 'model',
                        parts: [{ text: data.reply }]
                    };

                    // Nếu có image_url từ backend, thêm nó vào parts
                    if (data.image_url) {
                        newBotMessage.parts.push({
                            type: 'image',
                            url: data.image_url,
                            text: data.image_alt || '' // Sử dụng image_alt cho mô tả ảnh
                        });
                    }
                    updatedHistory.push(newBotMessage);

                } else if (data.error) {
                    updatedHistory.push({ role: 'model', parts: [{ text: `Lỗi: ${data.error}` }] });
                } else {
                    updatedHistory.push({ role: 'model', parts: [{ text: 'Rất tiếc, AI không phản hồi. Vui lòng thử lại.' }] });
                }
                return updatedHistory;
            });

        } catch (error) {
            console.error("Lỗi chi tiết:", error);
            setChatHistory((prevHistory) => {
                const updatedHistory = [...prevHistory];
                updatedHistory.push({
                    role: 'model',
                    parts: [{ text: `Xin lỗi, hệ thống tạm thời không khả dụng. (${error.message || 'Lỗi không xác định'}) Vui lòng thử lại sau.` }]
                });
                return updatedHistory;
            });
        } finally {
            setIsLoading(false); // Kết thúc loading
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isLoading) { // Không gửi tin nhắn nếu đang loading
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
                        {displayedMessages.map((msg) => (
                            <div
                                key={msg.key}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}
                            >
                                {msg.type === 'text' && (
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${msg.sender === 'user'
                                            ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-br-sm'
                                            : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                                        }`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                                    </div>
                                )}

                                {msg.type === 'image' && (
                                    <div className="max-w-[80%] bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                                        <img
                                            src={msg.url}
                                            alt={msg.alt}
                                            className="w-full max-h-60 object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                        {msg.alt && (
                                            <p className="px-3 py-2 text-xs text-gray-600 bg-gray-50">{msg.alt}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex justify-start animate-in slide-in-from-bottom-2">
                                <div className="max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm bg-white text-gray-800 rounded-bl-sm border border-gray-100">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                disabled={isLoading} // Disable input khi đang loading
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all text-sm disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || inputMessage.trim() === ''} // Disable button khi đang loading hoặc input rỗng
                                className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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