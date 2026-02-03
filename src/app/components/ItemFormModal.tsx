"use client";
// src/components/ItemFormModal.js
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: any) => void; // you can replace `any` with your Item type
  initialData?: any;
  title?: string;
}

const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  title = 'Add New Item',
}) => {
  const [name, setName] = useState(initialData.name || '');
  const [createdBy, setCreatedBy] = useState(initialData.created_by || '');
  const [hasQuantity, setHasQuantity] = useState(!!initialData.quantity);
  const [quantity, setQuantity] = useState(initialData.quantity || '');
  const [hasPrice, setHasPrice] = useState(!!initialData.price);
  const [price, setPrice] = useState(initialData.price || '');
  const [hasNotes, setHasNotes] = useState(!!initialData.notes);
  const [notes, setNotes] = useState(initialData.notes || '');

  const [customFields, setCustomFields] = useState(initialData.customFields || {});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Focus modal when opened
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Item name is required';
    if (!createdBy.trim()) newErrors.createdBy = 'Added by is required';

    if (hasQuantity) {
      if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
        newErrors.quantity = 'Quantity must be a positive number';
      }
    }

    if (hasPrice) {
      if (!price || isNaN(price) || Number(price) < 0) {
        newErrors.price = 'Price must be a non-negative number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    const item = {
      id: initialData.id,
      name: name.trim(),
      created_at: initialData.created_at || new Date().toISOString(),
      created_by: createdBy.trim(),
      ...(hasQuantity && { quantity: Number(quantity) }),
      ...(hasPrice && { price: Number(price) }),
      ...(hasQuantity && hasPrice && { total: Number(quantity) * Number(price) }),
      ...(hasNotes && { notes: notes.trim() }),
      customFields,
    };

    onSubmit(item);
    onClose();
  };

  const addCustomField = () => {
    if (!newKey.trim() || !newValue.trim()) return;

    setCustomFields((prev: Record<string, string>) => ({
      ...prev,
      [newKey.trim()]: newValue.trim(),
    }));

    setNewKey('');
    setNewValue('');
  };

  const removeCustomField = (key: string) => {
    setCustomFields((prev: Record<string, string>) => {
      const updated: Record<string, string> = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3 py-4 sm:px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 30 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter item name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all outline-none"
                  required
                />
                {errors.name && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="createdBy"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Added by <span className="text-red-500">*</span>
                </label>
                <input
                  id="createdBy"
                  type="text"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  placeholder="Your name or username"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all outline-none"
                  required
                />
                {errors.createdBy && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.createdBy}</p>
                )}
              </div>
            </div>

            {/* Quantity & Price - Modern Toggle Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={hasQuantity}
                      onChange={(e) => setHasQuantity(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Include Quantity
                  </span>
                </label>

                {hasQuantity && (
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    step="1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all outline-none"
                    placeholder="Enter quantity"
                  />
                )}
                {errors.quantity && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.quantity}</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={hasPrice}
                      onChange={(e) => setHasPrice(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Include Price
                  </span>
                </label>

                {hasPrice && (
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all outline-none"
                    placeholder="Enter price (AED)"
                  />
                )}
                {errors.price && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.price}</p>
                )}
              </div>
            </div>

            {/* Total Preview */}
            {hasQuantity && hasPrice && quantity && price && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Calculated Total:{' '}
                  <span className="font-semibold">
                    AED {(Number(quantity) * Number(price)).toFixed(2)}
                  </span>
                </p>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={hasNotes}
                    onChange={(e) => setHasNotes(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Include Notes
                </span>
              </label>

              {hasNotes && (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all outline-none resize-y"
                  placeholder="Additional notes, description or special instructions..."
                />
              )}
            </div>

            {/* Custom Fields Section */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Custom Fields
              </h3>

              {Object.entries(customFields as Record<string, string>).length > 0 && (
                <div className="space-y-3">
                  {Object.entries(customFields as Record<string, string>).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {key}: <span className="text-gray-600 dark:text-gray-400">{value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomField(key)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        aria-label={`Remove ${key} field`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4">
                <input
                  type="text"
                  placeholder="Field name (e.g. Color, Size)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all outline-none"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomField}
                  disabled={!newKey.trim() || !newValue.trim()}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer – Fixed */}
        <div className="flex-shrink-0 flex justify-end gap-4 px-6 py-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
          >
            {initialData.id ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ItemFormModal;