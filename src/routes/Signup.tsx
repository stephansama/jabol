import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Signup() {
  const navigate = useNavigate();
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .info()
      .then((i) => setAllowed(i.signupOpen))
      .catch(() => setAllowed(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.firstSignup(email, password);
      await signIn(email, password);
      navigate("/admin", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "signup failed");
    } finally {
      setBusy(false);
    }
  }

  if (allowed === null) {
    return <p className="mt-20 text-center text-fg-subtle">Checking…</p>;
  }

  if (!allowed) {
    return (
      <div className="mx-auto mt-20 max-w-md px-4 text-center">
        <h1 className="text-2xl font-bold text-fg">Signup closed</h1>
        <p className="mt-2 text-fg-subtle">
          An admin already exists. Ask them to invite you from the admin panel.
        </p>
        <Link to="/login" className="mt-4 inline-block text-accent-2 hover:underline">
          Go to sign in →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-20 max-w-md px-4">
      <h1 className="mb-1 text-2xl font-bold text-fg">Create the first admin</h1>
      <p className="mb-6 text-sm text-fg-subtle">
        This is a one-time setup — after this, only existing admins can create new accounts.
      </p>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="block text-xs text-fg-subtle">Minimum 8 characters.</span>
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Creating…" : "Create admin"}
        </Button>
      </form>
    </div>
  );
}
