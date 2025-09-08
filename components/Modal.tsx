
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div
        className="bg-white rounded-lg p-8 m-4 max-w-lg w-full shadow-xl relative"
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