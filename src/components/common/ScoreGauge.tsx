import React from 'react';

interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  label = 'Readiness Score',
  size = 'md',
  showSubtext = true,
}) => {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));

  let color = 'text-rose-400';
  let strokeColor = '#f43f5e';
  let category = 'Early Foundation';

  if (safeScore >= 80) {
    color = 'text-emerald-400';
    strokeColor = '#10b981';
    category = 'Recruitment Ready';
  } else if (safeScore >= 65) {
    color = 'text-indigo-400';
    strokeColor = '#6366f1';
    category = 'Strong Alignment';
  } else if (safeScore >= 45) {
    color = 'text-amber-400';
    strokeColor = '#f59e0b';
    category = 'Developing Momentum';
  }

  const dimensions = {
    sm: { width: 64, stroke: 5, radius: 26, fontSize: 'text-base font-bold' },
    md: { width: 104, stroke: 7, radius: 44, fontSize: 'text-2xl font-extrabold' },
    lg: { width: 144, stroke: 9, radius: 62, fontSize: 'text-4xl font-extrabold' },
  }[size];

  const circumference = 2 * Math.PI * dimensions.radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={dimensions.width}
          height={dimensions.width}
          className="transform -rotate-90 drop-shadow-md"
        >
          {/* Background circle */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.width / 2}
            r={dimensions.radius}
            stroke="#1e293b"
            strokeWidth={dimensions.stroke}
            fill="transparent"
          />
          {/* Animated active stroke */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.width / 2}
            r={dimensions.radius}
            stroke={strokeColor}
            strokeWidth={dimensions.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${dimensions.fontSize} ${color} tracking-tight`}>{safeScore}%</span>
        </div>
      </div>
      {label && <span className="mt-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">{label}</span>}
      {showSubtext && (
        <span className="text-[11px] font-medium text-slate-400">{category}</span>
      )}
    </div>
  );
};
