"use client";
import React from 'react';
import { MoonIcon, SunIcon, PlusIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  setIsAddModalOpen: (value: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, setDarkMode, setIsAddModalOpen }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg sm:text-2xl font-bold">SouqStack</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto justify-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition flex items-center text-sm sm:text-base"
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
      </div>
    </header>
  );
};

export default Header;