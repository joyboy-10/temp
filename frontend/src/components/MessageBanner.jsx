import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const MessageBanner = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <XCircle className="w-5 h-5" />;
      case 'warning': return <AlertCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getColorClasses = (type) => {
    switch (type) {
      case 'success': return 'bg-success-50 border-success-200 text-success-800';
      case 'error': return 'bg-error-50 border-error-200 text-error-800';
      case 'warning': return 'bg-warning-50 border-warning-200 text-warning-800';
      default: return 'bg-primary-50 border-primary-200 text-primary-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-up">
      <div className={`max-w-md p-4 rounded-lg border-2 shadow-lg ${getColorClasses(message.type)}`}>
        <div className="flex items-start gap-3">
          {getIcon(message.type)}
          <div className="flex-1">
            <p className="font-medium whitespace-pre-wrap">{message.text}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBanner;