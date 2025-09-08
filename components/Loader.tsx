import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const LoaderContent = () => (
    <div className="flex flex-col items-center justify-center">
      {/* BookNView Logo Animation */}
      <div className={`${sizeClasses[size]} relative mb-4`}>
        {/* Outer ring animation */}
        <div className="absolute inset-0 border-4 border-brand-red/20 rounded-full animate-pulse"></div>
        
        {/* Spinning ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-brand-red rounded-full animate-spin"></div>
        
        {/* Inner logo container */}
        <div className="absolute inset-2 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-xs">BV</span>
        </div>
        
        {/* Pulsing dots around the logo */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-brand-red rounded-full animate-ping"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-brand-red rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-brand-red rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-brand-red rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
      </div>
      
      {/* Loading text */}
      {text && (
        <div className="text-center">
          <p className={`${textSizes[size]} text-gray-600 font-medium animate-pulse`}>
            {text}
          </p>
          {/* Loading dots */}
          <div className="flex justify-center mt-2 space-x-1">
            <div className="w-1 h-1 bg-brand-red rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-brand-red rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-1 bg-brand-red rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-brand-dark via-black to-brand-gray flex items-center justify-center z-50">
        <div className="bg-brand-gray rounded-2xl shadow-2xl p-8 border border-brand-dark/40">
          <LoaderContent />
        </div>
      </div>
    );
  }

  return <LoaderContent />;
};

export default Loader; 