import React from 'react';
import './AnimatedButton.css';

interface AnimatedButtonProps {
  onClick?: () => void;
  defaultText: string;
  sentText: string;
  icon?: React.ReactNode;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  onClick, 
  defaultText, 
  sentText,
  icon 
}) => {
  const renderText = (text: string) => {
    return text.split('').map((char, index) => (
      <span key={index} style={{ '--i': index } as React.CSSProperties}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  return (
    <button className="button" onClick={onClick}>
      <div className="outline"></div>
      <div className="state state--default">
        <div className="icon">
          {icon || (
            <svg
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <p>{renderText(defaultText)}</p>
      </div>
      <div className="state state--sent">
        <div className="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            height="1em"
            width="1em"
            strokeWidth="0.5px"
            stroke="black"
          >
            <path
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="currentColor"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <p>{renderText(sentText)}</p>
      </div>
    </button>
  );
};

export default AnimatedButton;
