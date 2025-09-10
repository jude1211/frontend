
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string; // Optional custom classes for inner container
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className }) => {
  if (!isOpen) return null;

  const containerClasses = (className ? `${className} max-h-[85vh] overflow-y-auto no-scrollbar` : "bg-white rounded-lg p-8 m-4 max-w-lg w-full shadow-xl relative max-h-[85vh] overflow-y-auto no-scrollbar");

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 overflow-y-auto"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      {/* Local style to hide scrollbar while keeping scroll functionality */}
      <style>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      <div
        className={containerClasses}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10"
        >
          <i className="fa fa-times text-2xl"></i>
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;