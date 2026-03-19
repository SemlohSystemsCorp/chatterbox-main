"use client";

import { useState, useEffect, useRef } from "react";
import { PlusIcon as Plus, TrashIcon as Trash2, GrabberIcon as GripVertical } from "@primer/octicons-react";
import { Tooltip } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  position: number;
  created_at: string;
}

export function TodosPanel() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
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

  const active = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-[560px] px-6 py-8">
        <h2 className="text-[18px] font-bold text-white">My Todos</h2>
        <p className="mt-1 text-[13px] text-[#555]">
          Keep track of your personal tasks
        </p>

        {/* Add todo */}
        <form onSubmit={handleAdd} className="mt-6 flex gap-2">
          <input
            ref={inputRef}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add a new task..."
            maxLength={500}
            className="flex-1 rounded-[8px] border-2 border-transparent bg-[#1a1a1a] px-3 py-2.5 text-[14px] text-white placeholder:text-[#555] focus:border-white focus:bg-[#222] focus:outline-none"
          />
          <Tooltip label="Add todo">
            <button
              type="submit"
              disabled={!newText.trim() || adding}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-white text-black transition-colors hover:bg-[#ddd] disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </Tooltip>
        </form>

        {/* Active todos */}
        {active.length > 0 && (
          <div className="mt-6 space-y-1">
            {active.map((todo) => (
              <div
                key={todo.id}
                className="group flex items-center gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-[#111]"
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

        {/* Completed todos */}
        {completed.length > 0 && (
          <div className="mt-6">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#444]">
              Completed ({completed.length})
            </span>
            <div className="space-y-1">
              {completed.map((todo) => (
                <div
                  key={todo.id}
                  className="group flex items-center gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-[#111]"
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

        {active.length === 0 && completed.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-[14px] text-[#444]">No todos yet</p>
            <p className="mt-1 text-[12px] text-[#333]">
              Add your first task above
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
