import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { showToast } from "../components/Toast";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
}

export default function UsersPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ email: "", name: "", role: "", status: "" });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<User[]>("/api/users", { token });
      setUsers(data);
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
    setSubmitting(true);
    try {
      await api("/api/users", { method: "POST", body: form, token });
      setForm({ email: "", name: "", password: "" });
      setShowForm(false);
      showToast("Usuario creado", "success");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al crear", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit = (userId: string) => {
    return currentUser?.id === userId || currentUser?.role === "ADMIN";
  };

  const canDelete = () => {
    return currentUser?.role === "ADMIN";
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditForm({
      email: user.email,
      name: user.name || "",
      role: user.role,
      status: user.status,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      await api(`/api/users/${editingId}`, {
        method: "PATCH",
        body: {
          email: editForm.email,
          name: editForm.name || null,
          role: editForm.role,
          status: editForm.status,
        },
        token,
      });
      setEditingId(null);
      showToast("Usuario actualizado", "success");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al actualizar", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
      await api(`/api/users/${id}`, { method: "DELETE", token });
      showToast("Usuario eliminado", "success");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Usuarios</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Cancelar" : "Nuevo usuario"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 bg-white border border-gray-200 rounded-lg"
        >
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input
              type="email"
              placeholder="Email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Contraseña"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Creando..." : "Crear usuario"}
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
                <th className="text-left px-4 py-3 font-medium text-gray-700">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  {editingId === u.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({ ...editForm, email: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={editForm.role}
                          onChange={(e) =>
                            setEditForm({ ...editForm, role: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="CLIENT">CLIENT</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={editForm.status}
                          onChange={(e) =>
                            setEditForm({ ...editForm, status: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="BLOCKED">BLOCKED</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleSave}
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
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-gray-900">{u.email}</td>
                      <td className="px-4 py-3 text-gray-500">{u.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.role === "ADMIN"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {canEdit(u.id) && (
                            <button
                              onClick={() => startEdit(u)}
                              className="px-2 py-1 text-blue-600 text-xs hover:text-blue-800 transition-colors"
                            >
                              Editar
                            </button>
                          )}
                          {canDelete() && u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="px-2 py-1 text-red-600 text-xs hover:text-red-800 transition-colors"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
