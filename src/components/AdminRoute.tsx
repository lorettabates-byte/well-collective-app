import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../store/AppContext";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useApp();
  if (!user.isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
