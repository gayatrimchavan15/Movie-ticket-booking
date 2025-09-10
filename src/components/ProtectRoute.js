import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectRoute({ children, roleRequired }) {
  const { currentUser, userData } = useAuth();

  if (!currentUser) return <Navigate to="/login" />;
  if (roleRequired && userData?.role !== roleRequired) return <Navigate to="/" />;

  return children;
}
