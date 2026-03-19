"use client";

import { useState, useEffect, useRef } from "react";
import { XIcon as X, PlusIcon as Plus, TrashIcon as Trash2 } from "@primer/octicons-react";
import { Tooltip } from "@/components/ui/tooltip";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  position: number;
  created_at: string;
}

interface TodoModalProps {
  open: boolean;
  onClose: () => void;
}

export function TodoModal({ open, onClose }: TodoModalProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      fetchTodos();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  async function fetchTodos() {
    setLoading(true);
    try {
      const res = await fetch("/api/todos");
      if (res.ok) {
        const data = await res.json();
        setTodos(data.todos);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setTodos((prev) => [...prev, data.todo]);
        setNewText("");
        inputRef.current?.focus();
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(id: string, completed: boolean) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t))
    );
    await fetch("/api/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, completed }),
    });
  }

  async function handleDelete(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await fetch("/api/todos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  if (!open) return null;

  const active = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="flex max-h-[80vh] w-full max-w-[480px] flex-col rounded-[12px] border border-[#1a1a1a] bg-[#111] shadow-[0_16px_64px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#1a1a1a] px-5 py-4">
          <h2 className="text-[16px] font-bold text-white">My Todos</h2>
          <Tooltip label="Close">
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#555] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        {/* Add form */}
        <form onSubmit={handleAdd} className="flex shrink-0 gap-2 border-b border-[#1a1a1a] px-5 py-3">
          <input
            ref={inputRef}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add a new task..."
            maxLength={500}
            className="flex-1 rounded-[8px] border-2 border-transparent bg-[#1a1a1a] px-3 py-2 text-[14px] text-white placeholder:text-[#555] focus:border-white focus:bg-[#222] focus:outline-none"
          />
          <Tooltip label="Add todo">
            <button
              type="submit"
              disabled={!newText.trim() || adding}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white text-black transition-colors hover:bg-[#ddd] disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </Tooltip>
        </form>

        {/* List */}
        <div className="flex-1 overflow-auto px-5 py-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-white" />
            </div>
          ) : active.length === 0 && completed.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#444]">
              No todos yet. Add your first task above.
            </div>
          ) : (
            <>
              {active.length > 0 && (
                <div className="space-y-0.5">
                  {active.map((todo) => (
                    <div
                      key={todo.id}
                      className="group flex items-center gap-3 rounded-[6px] px-2 py-2 transition-colors hover:bg-[#1a1a1a]"
                    >
                      <button
                        onClick={() => handleToggle(todo.id, true)}
                        className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border-2 border-[#333] transition-colors hover:border-white"
                      />
                      <span className="flex-1 text-[14px] text-white">{todo.text}</span>
                      <Tooltip label="Delete todo">
                        <button
                          onClick={() => handleDelete(todo.id)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[#333] opacity-0 transition-all hover:text-[#de1135] group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              )}

              {completed.length > 0 && (
                <div className={active.length > 0 ? "mt-4" : ""}>
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
                    Completed ({completed.length})
                  </span>
                  <div className="space-y-0.5">
                    {completed.map((todo) => (
                      <div
                        key={todo.id}
                        className="group flex items-center gap-3 rounded-[6px] px-2 py-2 transition-colors hover:bg-[#1a1a1a]"
                      >
                        <button
                          onClick={() => handleToggle(todo.id, false)}
                          className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border-2 border-white bg-white"
                        >
                          <svg className="h-3 w-3 text-black" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <span className="flex-1 text-[14px] text-[#555] line-through">{todo.text}</span>
                        <button
                          onClick={() => handleDelete(todo.id)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[#333] opacity-0 transition-all hover:text-[#de1135] group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
