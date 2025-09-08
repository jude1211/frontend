import React from 'react';

interface BookNViewLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  variant?: 'logo' | 'spinner' | 'dots';
}

const BookNViewLoader: React.FC<BookNViewLoaderProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = false,
  variant = 'logo'
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const LogoLoader = () => (
    <div className="flex flex-col items-center justify-center">
      {/* BookNView Logo Container */}
      <div className={`${sizeClasses[size]} relative mb-6`}>
        {/* Background ring */}
        <div className="absolute inset-0 border-4 border-brand-red/20 rounded-full animate-pulse"></div>
        
        {/* Spinning ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-brand-red rounded-full animate-spin"></div>
        
        {/* Logo container */}
        <div className="absolute inset-2 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center shadow-xl">
          <div className="text-center">
            <div className="text-white font-bold text-lg mb-1">BookN</div>
            <div className="text-white font-bold text-lg">View</div>
          </div>
        </div>
        
        {/* Animated dots around logo */}
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-brand-red rounded-full animate-ping"></div>
        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-brand-red rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute -top-2 -left-2 w-3 h-3 bg-brand-red rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-brand-red rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
      </div>
      
      {/* Loading text */}
      {text && (
        <div className="text-center">
          <p className={`${textSizes[size]} text-gray-600 font-medium animate-pulse`}>
            {text}
          </p>
          {/* Loading dots */}
          <div className="flex justify-center mt-3 space-x-2">
            <div className="w-2 h-2 bg-brand-red rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-brand-red rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-brand-red rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
    </div>
  );

  const SpinnerLoader = () => (
    <div className="flex flex-col items-center justify-center">
      {/* Spinner */}
      <div className={`${sizeClasses[size]} relative mb-6`}>
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-brand-red rounded-full animate-spin"></div>
        <div className="absolute inset-0 border-4 border-transparent border-r-brand-red rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
      </div>
      
      {/* Loading text */}
      {text && (
        <div className="text-center">
          <p className={`${textSizes[size]} text-gray-600 font-medium animate-pulse`}>
            {text}
          </p>
        </div>
      )}
    </div>
  );

  const DotsLoader = () => (
    <div className="flex flex-col items-center justify-center">
      {/* Animated dots */}
      <div className="flex space-x-3 mb-4">
        <div className="w-4 h-4 bg-brand-red rounded-full animate-bounce"></div>
        <div className="w-4 h-4 bg-brand-red rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-4 h-4 bg-brand-red rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      
      {/* Loading text */}
      {text && (
        <div className="text-center">
          <p className={`${textSizes[size]} text-gray-600 font-medium animate-pulse`}>
            {text}
          </p>
        </div>
      )}
    </div>
  );

  const LoaderContent = () => {
    switch (variant) {
      case 'spinner':
        return <SpinnerLoader />;
      case 'dots':
        return <DotsLoader />;
      default:
        return <LogoLoader />;
    }
  };

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

export default BookNViewLoader; 