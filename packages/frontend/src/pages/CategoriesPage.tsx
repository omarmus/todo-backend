import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "../components/Toast";

interface Category {
  id: string;
  name: string;
  color: string | null;
}

export default function CategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#3b82f6");

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
    void load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("El nombre es obligatorio", "error");
      return;
    }

    setSubmitting(true);
    try {
      await api("/api/categories", {
        method: "POST",
        body: {
          name: trimmed,
          color,
        },
        token,
      });

      setName("");
      setColor("#3b82f6");
      showToast("Categoria creada", "success");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al crear", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color ?? "#3b82f6");
  };

  const handleSave = async () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      showToast("El nombre es obligatorio", "error");
      return;
    }

    try {
      await api(`/api/categories/${editingId}`, {
        method: "PATCH",
        body: {
          name: trimmed,
          color: editColor,
        },
        token,
      });

      setEditingId(null);
      showToast("Categoria actualizada", "success");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al guardar", "error");
    }
  };

  const handleDelete = async (category: Category) => {
    const confirmDelete = window.confirm(
      `Eliminar categoria "${category.name}"?`,
    );

    if (!confirmDelete) return;

    try {
      await api(`/api/categories/${category.id}`, {
        method: "DELETE",
        token,
      });
      showToast("Categoria eliminada", "success");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Categorias</h1>
          <p className="text-sm text-gray-500">Organiza tus tareas por color</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="mb-6 flex gap-3 items-end">
        <div className="flex-1 flex flex-col gap-1">
          <input
            type="text"
            required
            placeholder="Nombre de categoria..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-24 flex flex-col gap-1">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            title="Selecciona un color"
            className="h-10 w-full border border-gray-300 rounded-md p-1 cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Guardando..." : "Agregar"}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          No hay categorias aun
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
            >
              {editingId === category.id ? (
                <>
                  <div className="flex-1 flex gap-2 items-center">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleSave();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="h-8 w-10 border border-blue-200 rounded p-0.5 cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={() => void handleSave()}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-2 py-1 text-gray-500 text-xs hover:text-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <div
                    onDoubleClick={() => startEdit(category)}
                    className="flex-1 flex items-center gap-3 cursor-pointer"
                  >
                    <span
                      className="inline-flex h-4 w-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: category.color ?? "#3b82f6" }}
                    />
                    <span className="text-sm text-gray-900">{category.name}</span>
                  </div>
                  <button
                    onClick={() => startEdit(category)}
                    className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => void handleDelete(category)}
                    className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
