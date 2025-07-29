
import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XIcon } from '../icons'; // Ensure these icons are available

interface AlertProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose?: () => void;
  duration?: number; // Optional duration for auto-close
}

const Alert: React.FC<AlertProps> = ({ message, type, onClose, duration }) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const baseClasses = "p-4 rounded-md shadow-md flex items-start space-x-3 fixed top-20 right-5 z-[100] min-w-[300px] max-w-md animate-slideIn";
  let typeClasses = "";
  let IconComponent;

  switch (type) {
    case 'success':
      typeClasses = "bg-green-50 border-l-4 border-green-400 text-green-700";
      IconComponent = CheckCircleIcon;
      break;
    case 'error':
      typeClasses = "bg-red-50 border-l-4 border-red-400 text-red-700";
      IconComponent = XCircleIcon;
      break;
    case 'info':
    default:
      typeClasses = "bg-blue-50 border-l-4 border-blue-400 text-blue-700";
      IconComponent = InformationCircleIcon;
      break;
  }

  return (
    <div className={`${baseClasses} ${typeClasses}`} role="alert">
      <div className="flex-shrink-0">
        <IconComponent className={`h-5 w-5 ${ type === 'success' ? 'text-green-400' : type === 'error' ? 'text-red-400' : 'text-blue-400'}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <div className="flex-shrink-0">
          <button
            onClick={onClose}
            className={`-mr-1 -mt-1 p-1 rounded-md focus:outline-none focus:ring-2 ${
              type === 'success' ? 'hover:bg-green-100 focus:ring-green-500' : 
              type === 'error' ? 'hover:bg-red-100 focus:ring-red-500' : 
              'hover:bg-blue-100 focus:ring-blue-500'
            }`}
            aria-label="Fechar"
          >
            <XIcon className={`h-5 w-5 ${ type === 'success' ? 'text-green-500' : type === 'error' ? 'text-red-500' : 'text-blue-500'}`} />
          </button>
        </div>
      )}
       <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Alert;