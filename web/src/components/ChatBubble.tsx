import React from 'react';
import { Bot, User } from 'lucide-react';
import { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isAi = message.role === 'assistant';

  return (
    <div className={`flex w-full mb-6 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 ${
          isAi ? 'bg-indigo-100 text-indigo-600 mr-3' : 'bg-slate-200 text-slate-600 ml-3'
        }`}>
          {isAi ? <Bot size={18} /> : <User size={18} />}
        </div>

        {/* Bubble */}
        <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isAi 
            ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100' 
            : 'bg-indigo-600 text-white rounded-tr-none'
        }`}>
          {message.content}
        </div>
      </div>
    </div>
  );
};
