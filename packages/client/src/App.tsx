import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./routes/Home";
import { useSystemThemeSync } from "@/hooks/useTheme";
import { IS_STATIC } from "@/lib/static";

const Login = lazy(() => import("./routes/Login"));
const Signup = lazy(() => import("./routes/Signup"));
const Admin = lazy(() => import("./routes/Admin"));

export function App() {
  useSystemThemeSync();

  // A static build has no auth/admin surface — only the directory itself.
  // Everything else redirects home so deep links never hit a dead route.
  if (IS_STATIC) {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

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
