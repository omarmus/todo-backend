import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { showToast } from "../components/Toast";

interface Category {
  id: string;
  name: string;
  color?: string | null;
}

interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string | null;
  category?: Category | null;
}

export default function TodosPage() {
  const { token } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [categoryId, setCategoryId] = useState(""); // Estado para la categoría al crear

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [todosData, categoriesData] = await Promise.all([
        api<Todo[]>("/api/todo", { token }),
        api<Category[]>("/api/categories", { token }),
      ]);
      setTodos(todosData);
      setCategories(categoriesData);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al cargar datos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await api("/api/todo", {
        method: "POST",
        body: {
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
          categoryId: categoryId || undefined, // Se envía la categoría seleccionada
        },
        token,
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      setCategoryId("");
      showToast("Tarea creada", "success");
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al crear", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      await api(`/api/todo/${todo.id}`, {
        method: "PATCH",
        body: { completed: !todo.completed },
        token,
      });
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al actualizar", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api(`/api/todo/${id}`, { method: "DELETE", token });
      showToast("Tarea eliminada", "success");
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description ?? "");
    setEditDueDate(todo.dueDate ? todo.dueDate.split("T")[0] : "");
  };

  const handleSave = async () => {
    if (!editingId || !editTitle.trim()) return;
    try {
      await api(`/api/todo/${editingId}`, {
        method: "PATCH",
        body: {
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          dueDate: editDueDate || null,
        },
        token,
      });
      setEditingId(null);
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al guardar", "error");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  };

  // Filtrado de tareas según la categoría seleccionada en la parte superior
  const filteredTodos = todos.filter((todo) => {
    if (!selectedCategory) return true;
    return todo.category?.id === selectedCategory;
  });

  const completed = filteredTodos.filter((t) => t.completed).length;
  const total = filteredTodos.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Tareas</h1>
          <p className="text-sm text-gray-500">
            {completed} de {total} completadas (filtradas)
          </p>
        </div>

        {/* Filtro de categorías superior */}
        <div className="flex items-center gap-2">
          <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">Filtrar:</label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Formulario de creación con selector de categoría incluido */}
      <form onSubmit={handleCreate} className="mb-6 flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[200px] flex flex-col gap-1">
          <input
            type="text"
            placeholder="Nueva tarea..."
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-48 flex flex-col gap-1">
          <input
            type="text"
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-40 flex flex-col gap-1">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Selector de categoría al crear */}
        <div className="w-44 flex flex-col gap-1">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
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
      ) : filteredTodos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          No hay tareas en esta categoría
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {filteredTodos.map((todo) => (
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
                    className="w-full px-2 py-1 border border-blue-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="w-full px-2 py-1 border border-blue-200 rounded text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm ${
                        todo.completed
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {todo.title}
                    </span>

                    {/* Badge de la categoría con su color */}
                    {todo.category && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white shadow-sm"
                        style={{ backgroundColor: todo.category.color || "#3b82f6" }}
                      >
                        {todo.category.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-0.5">
                    {todo.description && (
                      <p className="text-xs text-gray-400">
                        {todo.description}
                      </p>
                    )}
                    {todo.dueDate && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          !todo.completed && new Date(todo.dueDate) < new Date()
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {formatDate(todo.dueDate)}
                      </span>
                    )}
                  </div>
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