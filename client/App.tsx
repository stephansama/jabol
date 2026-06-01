import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./routes/Home";
import { useSystemThemeSync } from "@/hooks/useTheme";

const Login = lazy(() => import("./routes/Login"));
const Signup = lazy(() => import("./routes/Signup"));
const Admin = lazy(() => import("./routes/Admin"));

export function App() {
  useSystemThemeSync();
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
