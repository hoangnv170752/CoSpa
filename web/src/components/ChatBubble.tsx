import React from 'react';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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
          {isAi ? (
            <ReactMarkdown
              className="prose prose-sm max-w-none prose-slate"
              components={{
                // Headings
                h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 text-slate-900" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 text-slate-900" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1 text-slate-900" {...props} />,
                
                // Paragraphs
                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                
                // Lists
                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="ml-2" {...props} />,
                
                // Emphasis
                strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
                
                // Code
                code: ({node, inline, ...props}: any) => 
                  inline ? (
                    <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                  ) : (
                    <code className="block bg-slate-100 text-slate-800 p-2 rounded text-xs font-mono overflow-x-auto mb-2" {...props} />
                  ),
                
                // Links
                a: ({node, ...props}) => <a className="text-indigo-600 hover:text-indigo-700 underline" target="_blank" rel="noopener noreferrer" {...props} />,
                
                // Blockquotes
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-300 pl-3 italic text-slate-600 mb-2" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            message.content
          )}
        </div>
      </div>
    </div>
  );
};
