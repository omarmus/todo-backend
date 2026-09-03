import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";
import TodosPage from "./pages/TodosPage";
import Layout from "./components/Layout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/todos"
        element={
          <ProtectedRoute>
            <TodosPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/todos" replace />} />
    </Routes>
  );
}
