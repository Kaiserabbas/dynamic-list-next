"use client";import React from 'react';
import { MoonIcon, SunIcon, PlusIcon } from '@heroicons/react/24/outline';

const Header = ({ darkMode, setDarkMode, setIsAddModalOpen }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">SouqStack</h1>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" /> Add Item
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
};

export default Header;