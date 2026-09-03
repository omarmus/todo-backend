import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { showToast } from "../components/Toast";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
}

export default function TodosPage() {
  const { token } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<Todo[]>("/todo", { token });
      setTodos(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al cargar", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await api("/todo", {
        method: "POST",
        body: { title: title.trim(), description: description.trim() || undefined },
        token,
      });
      setTitle("");
      setDescription("");
      showToast("Tarea creada", "success");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al crear", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      await api(`/todo/${todo.id}`, {
        method: "PATCH",
        body: { completed: !todo.completed },
        token,
      });
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al actualizar", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api(`/todo/${id}`, { method: "DELETE", token });
      showToast("Tarea eliminada", "success");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description ?? "");
  };

  const handleSave = async () => {
    if (!editingId || !editTitle.trim()) return;
    try {
      await api(`/todo/${editingId}`, {
        method: "PATCH",
        body: {
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
        },
        token,
      });
      setEditingId(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al guardar", "error");
    }
  };

  const completed = todos.filter((t) => t.completed).length;
  const total = todos.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Tareas</h1>
          <p className="text-sm text-gray-500">
            {completed} de {total} completadas
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="mb-6 flex gap-3">
        <input
          type="text"
          placeholder="Nueva tarea..."
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-64 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Agregar
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : todos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          No hay tareas aún
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo)}
                className="h-4 w-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />

              {editingId === todo.id ? (
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full px-2 py-1 border border-blue-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Descripción (opcional)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full px-2 py-1 border border-blue-200 rounded text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-0.5 text-gray-400 text-xs hover:text-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDoubleClick={() => startEdit(todo)}
                  className="flex-1 cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm ${
                        todo.completed
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {todo.title}
                    </span>
                    <svg
                      className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </div>
                  {todo.description && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {todo.description}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={() => handleDelete(todo.id)}
                className="text-gray-300 hover:text-red-500 transition-colors text-sm shrink-0"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
