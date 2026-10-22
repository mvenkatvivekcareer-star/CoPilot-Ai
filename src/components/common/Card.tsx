import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  glow = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 transition-all duration-200 ${
        glow ? 'shadow-[0_0_25px_rgba(99,102,241,0.07)] border-indigo-500/20' : 'shadow-xl shadow-slate-950/40'
      } ${
        hoverEffect ? 'hover:border-slate-700 hover:bg-slate-900 hover:-translate-y-0.5 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
