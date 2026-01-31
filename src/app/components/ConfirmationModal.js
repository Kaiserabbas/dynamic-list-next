"use client";
import React, { useEffect, useRef } from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 transform transition-all duration-300 scale-100"
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
        aria-labelledby="confirm-title"
      >
        <h2 id="confirm-title" className="text-lg font-bold mb-4">Confirm Action</h2>
        <p className="mb-4">{message}</p>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;