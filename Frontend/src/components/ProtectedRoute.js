import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");
  
  console.log("Checking authentication...");
  console.log("Token found:", token);

  if (!token) {
    console.log("No token found! Redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  console.log("User authenticated! Access granted.");
  return <Outlet />;
};

export default ProtectedRoute;
