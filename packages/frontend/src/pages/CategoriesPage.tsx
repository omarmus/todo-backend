import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { showToast } from "../components/Toast";

interface Category {
  id: string;
  name: string;
  color?: string | null;
}

export default function CategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", color: "#3b82f6" });
  const [submitting, setSubmitting] = useState(false);

  // Estados para edición inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", color: "#3b82f6" });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<Category[]>("/api/categories", { token });
      setCategories(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al cargar categorías", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await api("/api/categories", { method: "POST", body: form, token });
      setForm({ name: "", color: "#3b82f6" });
      setShowForm(false);
      showToast("Categoría creada con éxito", "success");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al crear categoría", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;
    try {
      await api(`/api/categories/${id}`, { method: "DELETE", token });
      showToast("Categoría eliminada", "success");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, color: cat.color || "#3b82f6" });
  };

  const handleUpdate = async (id: string) => {
    if (!editForm.name.trim()) return;
    try {
      await api(`/api/categories/${id}`, { method: "PATCH", body: editForm, token });
      setEditingId(null);
      showToast("Categoría actualizada", "success");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al actualizar", "error");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Categorías</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Cancelar" : "Nueva categoría"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 bg-white border border-gray-200 rounded-lg flex items-center gap-4"
        >
          <input
            type="text"
            placeholder="Nombre de la categoría..."
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="w-12 h-10 p-1 border border-gray-300 rounded-md cursor-pointer bg-white"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Creando..." : "Guardar"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Color</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Nombre</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                    No hay categorías creadas aún.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 w-16">
                      {editingId === cat.id ? (
                        <input
                          type="color"
                          value={editForm.color}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                          className="w-8 h-8 p-1 border rounded cursor-pointer bg-white"
                        />
                      ) : (
                        <span
                          className="w-5 h-5 rounded-full inline-block border border-gray-300 shadow-sm"
                          style={{ backgroundColor: cat.color || "#ccc" }}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {editingId === cat.id ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                        />
                      ) : (
                        cat.name
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {editingId === cat.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(cat.id)}
                            className="text-green-600 hover:underline font-medium text-xs"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-500 hover:underline font-medium text-xs"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(cat)}
                            className="text-blue-600 hover:underline font-medium text-xs"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="text-red-600 hover:underline font-medium text-xs"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}