"use client";

import React, { useReducer, useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ItemList from "./components/ItemList";
import ItemFormModal from "./components/ItemFormModal";
import ConfirmationModal from "./components/ConfirmationModal";

// ---------------- TYPES ----------------
type Item = {
  id: number;
  name: string;
  created_by: string;
  created_at: string;
  quantity?: number;
  price?: number;
  total?: number;
  notes?: string;
  category?: string;
  customFields?: Record<string, string>;
};

type Action =
  | { type: "SET_ITEMS"; payload: Item[] }
  | { type: "ADD_ITEM"; payload: Item }
  | { type: "EDIT_ITEM"; payload: Item }
  | { type: "DELETE_ITEM"; payload: number }
  | { type: "OPTIMISTIC_ADD"; payload: Item }
  | { type: "OPTIMISTIC_EDIT"; payload: Item }
  | { type: "OPTIMISTIC_DELETE"; payload: number };

const itemsReducer = (state: Item[], action: Action): Item[] => {
  switch (action.type) {
    case "SET_ITEMS":
      return action.payload;
    case "ADD_ITEM":
    case "OPTIMISTIC_ADD":
      return [...state, action.payload];
    case "EDIT_ITEM":
    case "OPTIMISTIC_EDIT":
      return state.map((item) =>
        item.id === action.payload.id ? action.payload : item
      );
    case "DELETE_ITEM":
    case "OPTIMISTIC_DELETE":
      return state.filter((item) => item.id !== action.payload);
    default:
      return state;
  }
};

// ---------------- PAGE ----------------
export default function HomePage() {
  const [items, dispatch] = useReducer(itemsReducer, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  // Fetch items from database on mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/items");
        if (!res.ok) throw new Error("Failed to fetch items");
        const data = await res.json();
        dispatch({ type: "SET_ITEMS", payload: data });
      } catch (err: any) {
        setError(err.message || "Could not load items");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<any>(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  // ---------------- HANDLERS ----------------
  const handleAdd = (newItem: Omit<Item, "id" | "created_at" | "created_by">) => {
    setConfirmAction({ type: "save", payload: newItem });
    setIsConfirmModalOpen(true);
  };

  const handleEdit = (updatedItem: Item) => {
    setConfirmAction({ type: "save", payload: updatedItem });
    setIsConfirmModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setConfirmAction({ type: "delete", payload: id });
    setIsConfirmModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;

    const isAdd = confirmAction.type === "save" && !editingItem;
    const isEdit = confirmAction.type === "save" && !!editingItem;
    const isDelete = confirmAction.type === "delete";

    try {
      if (isDelete) {
        dispatch({ type: "OPTIMISTIC_DELETE", payload: confirmAction.payload });

        const res = await fetch("/api/items", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: confirmAction.payload }),
        });

        if (!res.ok) throw new Error("Delete failed");
      } else {
        const itemToSend = {
          ...confirmAction.payload,
          id: isEdit ? confirmAction.payload.id : undefined, // server will generate if new
        };

        // Optimistic update
        if (isAdd) {
          const tempId = Date.now();
          dispatch({
            type: "OPTIMISTIC_ADD",
            payload: { ...itemToSend, id: tempId, created_at: new Date().toISOString() },
          });
        } else if (isEdit) {
          dispatch({ type: "OPTIMISTIC_EDIT", payload: itemToSend });
        }

        const method = isEdit ? "PUT" : "POST";
        const res = await fetch("/api/items", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemToSend),
        });

        if (!res.ok) {
          throw new Error(`${isEdit ? "Update" : "Add"} failed`);
        }

        // Refresh full list after success (to get real server IDs/timestamps)
        const refreshed = await fetch("/api/items").then((r) => r.json());
        dispatch({ type: "SET_ITEMS", payload: refreshed });

        if (isAdd) setIsAddModalOpen(false);
        if (isEdit) {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }
      }
    } catch (err: any) {
      setError(err.message || "Operation failed");
      console.error(err);
      // Rollback optimistic update on error (optional)
      // For simplicity, we refetch full list above on success
    }

    setConfirmAction(null);
    setIsConfirmModalOpen(false);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  // ---------------- FILTERING & SORTING (client-side for now) ----------------
  const filteredAndSortedItems = React.useMemo(() => {
    let result = [...items];

    // Search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((item) => {
        return (
          item.name?.toLowerCase().includes(s) ||
          item.created_by?.toLowerCase().includes(s) ||
          item.notes?.toLowerCase().includes(s) ||
          item.category?.toLowerCase().includes(s) ||
          Object.values(item.customFields || {}).some((v) =>
            String(v).toLowerCase().includes(s)
          )
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      let valA: any = a[sortBy as keyof Item] ?? "";
      let valB: any = b[sortBy as keyof Item] ?? "";

      if (sortBy === "total") {
        valA = (a.quantity || 0) * (a.price || 0);
        valB = (b.quantity || 0) * (b.price || 0);
      }
      if (sortBy === "created_at") {
        valA = new Date(a.created_at).getTime();
        valB = new Date(b.created_at).getTime();
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [items, search, sortBy, sortDir]);

  const customKeys = React.useMemo(
    () => [...new Set(items.flatMap((i) => Object.keys(i.customFields || {})))],
    [items]
  );

  if (loading) return <div className="p-10 text-center">Loading items from database...</div>;
  if (error) return <div className="p-10 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        setIsAddModalOpen={setIsAddModalOpen}
      />

      <main className="flex-grow container mx-auto p-4">
        <ItemList
          items={filteredAndSortedItems}
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
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAdd}
          title="Add New Item"
        />
      )}

      {isEditModalOpen && editingItem && (
        <ItemFormModal
          isOpen={isEditModalOpen}
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