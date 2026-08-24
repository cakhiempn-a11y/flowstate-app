import React from 'react';

export const Mascot: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1" />
      <path d="M35 30C35 25 30 20 25 25C20 30 25 35 25 35L35 30Z" fill="currentColor" />
      <path d="M65 30C65 25 70 20 75 25C80 30 75 35 75 35L65 30Z" fill="currentColor" />
      <rect x="25" y="40" width="50" height="45" rx="20" fill="currentColor" opacity="0.9" />
      <circle cx="40" cy="55" r="4" fill="white" />
      <circle cx="60" cy="55" r="4" fill="white" />
      <ellipse cx="50" cy="70" rx="12" ry="8" fill="white" opacity="0.3" />
      <path d="M47 70Q50 73 53 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};
