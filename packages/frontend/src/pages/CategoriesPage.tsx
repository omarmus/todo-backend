import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { showToast } from "../components/Toast";

interface Category {
  id: string;
  name: string;
  color: string | null;
  userId: string;
}

export default function CategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<Category[]>("/api/categories", { token });
      setCategories(data);
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
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await api("/api/categories", {
        method: "POST",
        body: {
          name: name.trim(),
          color: color || undefined,
        },
        token,
      });
      setName("");
      setColor("#3B82F6");
      showToast("Categoría creada", "success");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al crear", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api(`/api/categories/${id}`, { method: "DELETE", token });
      showToast("Categoría eliminada", "success");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color || "#3B82F6");
  };

  const handleSave = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await api(`/api/categories/${editingId}`, {
        method: "PATCH",
        body: {
          name: editName.trim(),
          color: editColor || null,
        },
        token,
      });
      setEditingId(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al guardar", "error");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Categorías</h1>
          <p className="text-sm text-gray-500">
            {categories.length} {categories.length === 1 ? "categoría" : "categorías"}
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="mb-6 flex gap-3 items-end">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs text-gray-500">Nombre</label>
          <input
            type="text"
            placeholder="Nueva categoría..."
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-24 flex flex-col gap-1">
          <label className="text-xs text-gray-500">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-[38px] w-full border border-gray-300 rounded-md cursor-pointer"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Agregar
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          No hay categorías aún
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
            >
              {editingId === category.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-8 w-12 border border-blue-200 rounded cursor-pointer"
                  />
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
              ) : (
                <div
                  onDoubleClick={() => startEdit(category)}
                  className="flex-1 flex items-center gap-3 cursor-pointer group"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-gray-200 shrink-0"
                    style={{ backgroundColor: category.color || "#9CA3AF" }}
                  />
                  <span className="text-sm text-gray-900 font-medium">
                    {category.name}
                  </span>
                  <svg
                    className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                </div>
              )}
              <button
                onClick={() => handleDelete(category.id)}
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