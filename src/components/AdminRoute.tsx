import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAdminLoggedIn, loadAdminSession } from "../utils/adminAuth";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // loadAdminSession populates the in-memory cache from Preferences.
    // On web or after a warm launch it resolves quickly; on native cold start
    // it ensures Preferences data is loaded even if main.tsx hasn't finished yet.
    loadAdminSession().then(() => {
      setIsAdmin(isAdminLoggedIn());
      setLoading(false);
    });
  }, []);

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
