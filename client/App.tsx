import { Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./routes/Home";
import { Login } from "./routes/Login";
import { Signup } from "./routes/Signup";
import { Admin } from "./routes/Admin";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
