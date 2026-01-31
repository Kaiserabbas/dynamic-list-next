"use client";

import React, { useReducer, useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ItemList from "./components/ItemList";
import ItemFormModal from "./components/ItemFormModal";
import ConfirmationModal from "./components/ConfirmationModal";
import useLocalStorage from "../app/hooks/useLocalStorage";

// ---------------- REDUCER ----------------
type Item = any;

type Action =
  | { type: "ADD_ITEM"; payload: Item }
  | { type: "EDIT_ITEM"; payload: Item }
  | { type: "DELETE_ITEM"; payload: number }
  | { type: "SET_ITEMS"; payload: Item[] };

const itemsReducer = (state: Item[], action: Action) => {
  switch (action.type) {
    case "ADD_ITEM":
      return [...state, action.payload];
    case "EDIT_ITEM":
      return state.map((item) =>
        item.id === action.payload.id ? action.payload : item
      );
    case "DELETE_ITEM":
      return state.filter((item) => item.id !== action.payload);
    case "SET_ITEMS":
      return action.payload;
    default:
      return state;
  }
};

// ---------------- PAGE ----------------
export default function Page() {
  const [items, dispatch] = useReducer(itemsReducer, []);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("items");
    if (stored) {
      dispatch({ type: "SET_ITEMS", payload: JSON.parse(stored) });
    }
    setHydrated(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("items", JSON.stringify(items));
    }
  }, [items, hydrated]);

  // Dark mode
  const [darkMode, setDarkMode] = useLocalStorage("darkMode", false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<any>(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  if (!hydrated) return null;

  // ---------------- HANDLERS ----------------
  const handleAdd = (item: Item) => {
    setConfirmAction({
      type: "save",
      payload: { ...item, id: Date.now() },
    });
    setIsConfirmModalOpen(true);
  };

  const handleEdit = (item: Item) => {
    setConfirmAction({ type: "save", payload: item });
    setIsConfirmModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setConfirmAction({ type: "delete", payload: id });
    setIsConfirmModalOpen(true);
  };

  const handleConfirm = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "delete") {
      dispatch({ type: "DELETE_ITEM", payload: confirmAction.payload });
    } else {
      if (editingItem) {
        dispatch({ type: "EDIT_ITEM", payload: confirmAction.payload });
        setIsEditModalOpen(false);
        setEditingItem(null);
      } else {
        dispatch({ type: "ADD_ITEM", payload: confirmAction.payload });
        setIsAddModalOpen(false);
      }
    }

    setConfirmAction(null);
    setIsConfirmModalOpen(false);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  // ---------------- FILTERING ----------------
  const filteredItems = items.filter((item) => {
    const s = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(s) ||
      Object.values(item.customFields || {}).some((v: any) =>
        String(v).toLowerCase().includes(s)
      )
    );
  });

  const customKeys = [
    ...new Set(items.flatMap((i) => Object.keys(i.customFields || {}))),
  ];

  // ---------------- RENDER ----------------
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        setIsAddModalOpen={setIsAddModalOpen}
      />

      <main className="flex-grow container mx-auto p-4">
        <ItemList
          items={filteredItems}
          customKeys={customKeys}
          onEdit={openEditModal}
          onDelete={handleDelete}
          search={search}
          setSearch={setSearch}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortDir={sortDir}
          setSortDir={setSortDir}
        />
      </main>

      <Footer />

      {isAddModalOpen && (
        <ItemFormModal
          isOpen
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAdd}
          title="Add Item"
        />
      )}

      {isEditModalOpen && (
        <ItemFormModal
          isOpen
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingItem(null);
          }}
          onSubmit={handleEdit}
          initialData={editingItem}
          title="Edit Item"
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirm}
        message={
          confirmAction?.type === "delete"
            ? "Are you sure you want to delete this item?"
            : "Are you sure you want to save changes?"
        }
      />
    </div>
  );
}
