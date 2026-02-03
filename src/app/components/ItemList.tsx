"use client";

// src/components/ItemList.js
import React, { useState, useMemo } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ROWS_OPTIONS = [5, 10, 20, 50];

const formatDate = (dateString) => {
  if (!dateString || dateString === 'No Date' || dateString === 'Invalid Date') {
    return 'No Date';
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

const groupItemsByDate = (items) => {
  const groups = {};

  items.forEach(item => {
    // Fallback to today's date if created_at is missing or invalid
    let dateKey = 'No Date';

    if (item.created_at && typeof item.created_at === 'string') {
      try {
        dateKey = item.created_at.split('T')[0]; // YYYY-MM-DD
      } catch (err) {
        // If split fails for any weird reason, fallback
        dateKey = 'Invalid Date';
      }
    }

    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(item);
  });

  // Sort dates descending (newest first) – handle fallback keys at the end
  return Object.entries(groups)
    .sort(([a], [b]) => {
      if (a === 'No Date' || a === 'Invalid Date') return 1;
      if (b === 'No Date' || b === 'Invalid Date') return -1;
      return b.localeCompare(a);
    })
    .map(([date, items]) => ({ date, items }));
};

const ItemList = ({
  items,              // now receives ALL filtered & searched items (not paginated yet)
  customKeys,
  onEdit,
  onDelete,
  search,
  setSearch,
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
}) => {
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Sort all items first
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortBy === 'date') {
        return sortDir === 'asc'
          ? a.created_at.localeCompare(b.created_at)
          : b.created_at.localeCompare(a.created_at);
      }
      // ... existing name / price / total sorting logic
      let valA = sortBy === 'total' ? (a.quantity * a.price || 0) : (a[sortBy] || '');
      let valB = sortBy === 'total' ? (b.quantity * b.price || 0) : (b[sortBy] || '');
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortBy, sortDir]);

  // 2. Group sorted items by date
  const dateGroups = useMemo(() => groupItemsByDate(sortedItems), [sortedItems]);

  // Flatten for pagination (we paginate across all groups)
  const flatPaginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedItems.slice(start, end);
  }, [sortedItems, currentPage, rowsPerPage]);

  // For showing which items are visible (used in header)
  const totalItems = sortedItems.length;
  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(startItem + rowsPerPage - 1, totalItems);

  if (totalItems === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold">No items found</p>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {search ? 'Try adjusting your search' : 'Add your first item!'}
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalItems / rowsPerPage);

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 w-full sm:w-80 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex flex-wrap gap-3 items-center">
          {/* Sort buttons */}
          {['name', 'price', 'total', 'date'].map(key => (
            <button
              key={key}
              onClick={() => {
                if (sortBy === key) {
                  setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy(key);
                  setSortDir('asc');
                }
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                sortBy === key ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-200 dark:bg-gray-700'
              } hover:bg-gray-300 dark:hover:bg-gray-600`}
            >
              {key === 'date' ? 'Date' : key.charAt(0).toUpperCase() + key.slice(1)}{' '}
              {sortBy === key && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
          ))}

          {/* Rows per page */}
          <div className="flex items-center gap-2 text-sm">
            <label>Show:</label>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800"
            >
              {ROWS_OPTIONS.map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Showing X–Y of Z */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalItems}</strong> items
      </div>

      {/* Grouped content */}
      {dateGroups.map(({ date, items: groupItems }) => {
        // Only show items that are in the current pagination slice
        const visibleInGroup = groupItems.filter(item => flatPaginated.includes(item));

        if (visibleInGroup.length === 0) return null;

        return (
          <div key={date} className="mb-10">
            <h2 className="text-lg font-semibold mb-3 border-b border-gray-300 dark:border-gray-600 pb-2">
              {formatDate(date)}
            </h2>

            <div className="overflow-x-auto rounded-lg shadow-sm">
              <table className="min-w-full bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created by</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Notes</th>
                    {customKeys.map(key => (
                      <th key={key} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        {key}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {visibleInGroup.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.quantity ?? '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.price ?? '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{item.total ?? '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                        {item.created_by}
                      </td>
                      <td className="px-6 py-4">{item.notes ?? '—'}</td>
                      {customKeys.map(key => (
                        <td key={key} className="px-6 py-4">{item.customFields?.[key] ?? '—'}</td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => onEdit(item)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        >
                          <PencilIcon className="h-5 w-5 inline" />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-5 w-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded border disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded border disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ←
            </button>

            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 7) {
                if (currentPage > 4) page = currentPage - 3 + i;
                if (page > totalPages - 3) page = totalPages - 6 + i;
              }
              if (page < 1 || page > totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded border ${
                    currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded border disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              →
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded border disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemList;