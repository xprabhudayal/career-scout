'use client'
import { MessageCircle } from "lucide-react";
import { useRef, useEffect } from "react";


export const ChatMessages = ({ messages, darkMode }) => {
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={`flex flex-col p-8 rounded-2xl h-full transition-colors ${
      darkMode
        ? 'bg-gradient-to-br from-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-gray-100 to-gray-200'
    }`}>
      <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <h1 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Conversations
            </h1>
          </div>
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-2xl ${
              message.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-md'
                : message.role === 'system'
                ? `${darkMode ? 'bg-yellow-500' : 'bg-yellow-400'} text-black rounded-bl-md text-base`
                : `${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'} rounded-bl-md`
            }`}>
              <p className="text-base/5">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.role === 'user'
                  ? 'text-blue-200'
                  : darkMode ? 'text-gray-600' : 'text-gray-700'
              }`}>
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};