import React from 'react';

interface ProgressBarProps {
  percent: number;
  className?: string;
  barColor?: string; // e.g., 'bg-green-500'
  bgColor?: string; // e.g., 'bg-gray-200'
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  percent, 
  className = '', 
  barColor = 'bg-primary', 
  bgColor = 'bg-gray-300' 
}) => {
  const safePercent = Math.max(0, Math.min(100, percent));

  return (
    <div className={`w-full ${bgColor} rounded-full h-2.5 ${className}`}>
      <div
        className={`${barColor} h-2.5 rounded-full transition-all duration-300 ease-linear`}
        style={{ width: `${safePercent}%` }}
        role="progressbar"
        aria-valuenow={safePercent}
        aria-valuemin={0}
        aria-valuemax={100}
      ></div>
    </div>
  );
};

export default ProgressBar;