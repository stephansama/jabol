import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, user } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  useEffect(() => {
    if (user) navigate("/admin", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    api.info().then((i) => setSignupOpen(i.signupOpen)).catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      navigate("/admin", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-20 max-w-md px-4">
      <h1 className="mb-6 text-2xl font-bold text-fg">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-md border border-border bg-surface p-6">
        <label className="block space-y-1">
          <span className="text-sm text-fg-subtle">Email</span>
          <Input
            type="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-fg-subtle">Password</span>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-fg-subtle">
        {signupOpen ? (
          <>
            No admin yet?{" "}
            <Link to="/signup" className="text-accent-2 hover:underline">
              Create the first admin
            </Link>
          </>
        ) : (
          <Link to="/" className="text-accent-2 hover:underline">
            ← Back to directory
          </Link>
        )}
      </p>
    </div>
  );
}
