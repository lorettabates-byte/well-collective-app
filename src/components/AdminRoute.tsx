import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAdminLoggedIn, loadAdminSession } from "../utils/adminAuth";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminSession()
      .catch(() => {})
      .finally(() => {
        setIsAdmin(isAdminLoggedIn());
        setLoading(false);
      });
  }, []);

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
