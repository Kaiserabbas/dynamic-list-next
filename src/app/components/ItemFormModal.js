"use client";
// src/components/ItemFormModal.js
import React, { useState, useEffect, useRef } from 'react';

const ItemFormModal = ({ isOpen, onClose, onSubmit, initialData = {}, title }) => {
  const [name, setName] = useState(initialData.name || '');
  const [createdBy, setCreatedBy] = useState(initialData.created_by || ''); // ← new state
  const [hasQuantity, setHasQuantity] = useState(!!initialData.quantity);
  const [quantity, setQuantity] = useState(initialData.quantity || '');
  const [hasPrice, setHasPrice] = useState(!!initialData.price);
  const [price, setPrice] = useState(initialData.price || '');
  const [hasNotes, setHasNotes] = useState(!!initialData.notes);
  const [notes, setNotes] = useState(initialData.notes || '');

  const [customFields, setCustomFields] = useState(initialData.customFields || {});
  const [newCustomKey, setNewCustomKey] = useState('');
  const [newCustomValue, setNewCustomValue] = useState('');
  const [errors, setErrors] = useState({});

  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!createdBy.trim()) newErrors.createdBy = 'Added by is required'; // ← new validation
    if (hasQuantity && (isNaN(quantity) || Number(quantity) <= 0)) {
      newErrors.quantity = 'Quantity must be a positive number';
    }
    if (hasPrice && (isNaN(price) || Number(price) <= 0)) {
      newErrors.price = 'Price must be a positive number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const item = {
      id: initialData.id,
      name: name.trim(),
      created_at: initialData.created_at || new Date().toISOString(),
      created_by: createdBy.trim(),           // ← now comes from the input
      ...(hasQuantity && { quantity: Number(quantity) }),
      ...(hasPrice && { price: Number(price) }),
      ...(hasQuantity && hasPrice && { total: Number(quantity) * Number(price) }),
      ...(hasNotes && { notes: notes.trim() }),
      customFields,
    };

    onSubmit(item);
  };

  const addCustomField = () => {
    if (newCustomKey.trim() && newCustomValue.trim()) {
      setCustomFields({
        ...customFields,
        [newCustomKey.trim()]: newCustomValue.trim(),
      });
      setNewCustomKey('');
      setNewCustomValue('');
    }
  };

  const removeCustomField = (key) => {
    const { [key]: removed, ...rest } = customFields;
    setCustomFields(rest);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg w-full mx-4 transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title" className="text-xl font-bold mb-5">
          {title}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-5">
            <label className="block mb-1.5 font-medium">Item Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2.5 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-required="true"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Added by – NEW FIELD */}
          <div className="mb-5">
            <label className="block mb-1.5 font-medium">Added by *</label>
            <input
              type="text"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="Your name or username"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2.5 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {errors.createdBy && (
              <p className="text-red-600 text-sm mt-1">{errors.createdBy}</p>
            )}
          </div>

          {/* Quantity */}
          <div className="mb-5">
            <label className="flex items-center mb-1.5">
              <input
                type="checkbox"
                checked={hasQuantity}
                onChange={(e) => setHasQuantity(e.target.checked)}
                className="mr-2 h-4 w-4"
              />
              Include Quantity
            </label>
            {hasQuantity && (
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                step="1"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2.5 mt-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>}
          </div>

          {/* Price */}
          <div className="mb-5">
            <label className="flex items-center mb-1.5">
              <input
                type="checkbox"
                checked={hasPrice}
                onChange={(e) => setHasPrice(e.target.checked)}
                className="mr-2 h-4 w-4"
              />
              Include Price
            </label>
            {hasPrice && (
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0.01"
                step="0.01"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2.5 mt-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
          </div>

          {hasQuantity && hasPrice && (
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400 italic">
              Total will be automatically calculated (Quantity × Price).
            </p>
          )}

          {/* Notes */}
          <div className="mb-5">
            <label className="flex items-center mb-1.5">
              <input
                type="checkbox"
                checked={hasNotes}
                onChange={(e) => setHasNotes(e.target.checked)}
                className="mr-2 h-4 w-4"
              />
              Include Notes
            </label>
            {hasNotes && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2.5 mt-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Custom Fields */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Custom Fields</h3>
            {Object.entries(customFields).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between mb-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <span className="font-medium">{key}:</span>
                <div className="flex items-center gap-3">
                  <span>{value}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomField(key)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <input
                type="text"
                placeholder="Field name (key)"
                value={newCustomKey}
                onChange={(e) => setNewCustomKey(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2.5 bg-white dark:bg-gray-700"
              />
              <input
                type="text"
                placeholder="Value"
                value={newCustomValue}
                onChange={(e) => setNewCustomValue(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2.5 bg-white dark:bg-gray-700"
              />
              <button
                type="button"
                onClick={addCustomField}
                className="bg-green-600 text-white px-5 py-2.5 rounded-md hover:bg-green-700 transition"
                disabled={!newCustomKey.trim() || !newCustomValue.trim()}
              >
                Add Field
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
            >
              {initialData.id ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemFormModal;