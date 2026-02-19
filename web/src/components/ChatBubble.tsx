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
                h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-4 mb-3 text-slate-900 first:mt-0" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-base font-bold mt-4 mb-2 text-slate-900 first:mt-0" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-sm font-semibold mt-3 mb-2 text-slate-800 first:mt-0" {...props} />,

                // Paragraphs
                p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,

                // Lists - improved styling
                ul: ({node, ...props}) => <ul className="mb-4 last:mb-0 space-y-2 pl-0" {...props} />,
                ol: ({node, ...props}) => <ol className="mb-4 last:mb-0 space-y-2 pl-0 list-none counter-reset-item" {...props} />,
                li: ({node, children, ...props}) => (
                  <li className="relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-indigo-500 before:font-bold" {...props}>
                    <div className="inline">{children}</div>
                  </li>
                ),

                // Emphasis
                strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                em: ({node, ...props}) => <em className="italic text-slate-700" {...props} />,

                // Code
                code: ({node, inline, ...props}: any) =>
                  inline ? (
                    <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                  ) : (
                    <code className="block bg-slate-50 text-slate-800 p-3 rounded-lg text-xs font-mono overflow-x-auto mb-3 border border-slate-200" {...props} />
                  ),

                // Links
                a: ({node, ...props}) => <a className="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300 hover:decoration-indigo-500 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,

                // Blockquotes
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-400 pl-4 py-1 italic text-slate-600 mb-3 bg-indigo-50/50 rounded-r" {...props} />,

                // Horizontal rule
                hr: ({node, ...props}) => <hr className="my-4 border-slate-200" {...props} />,
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
