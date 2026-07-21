import { useLocation, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminChip() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const initial = user.email.charAt(0).toUpperCase();
  const onAdminPage = location.pathname === "/admin";

  return (
    <div className="flex items-center gap-2">
      {!onAdminPage && (
        <Button
          variant="outline"
          size="sm"
          className="px-2"
          aria-label="admin"
          title="admin"
          onClick={() => navigate("/admin")}
        >
          <Shield className="h-4 w-4 text-accent" />
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-sm px-1 py-0.5 text-fg-subtle hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={user.email}
          >
            <span
              aria-hidden
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold"
              style={{
                background:
                  "color-mix(in srgb, var(--accent) 22%, var(--surface))",
                color: "var(--accent)",
              }}
            >
              {initial}
            </span>
            <span className="hidden max-w-[140px] truncate text-xs text-fg-subtle md:inline">
              {user.email}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>signed in</DropdownMenuLabel>
          <DropdownMenuItem disabled className="!opacity-100 text-xs text-fg-subtle">
            {user.email}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate("/admin")}>
            admin
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={async () => {
              await signOut();
              navigate("/");
            }}
          >
            sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function SignInPanel() {
  const { user, refresh } = useSession();
  const navigate = useNavigate();

  if (user) return null;

  return (
    <div className="flex items-center gap-2">
      {import.meta.env.DEV && (
        <Button
          variant="ghost"
          size="sm"
          title="dev sign-in (NODE_ENV !== production)"
          onClick={async () => {
            try {
              await api.signIn("dev@local.dev", "devpassword");
              await refresh();
              navigate("/");
            } catch (err) {
              console.error("[dev] sign-in failed:", err);
            }
          }}
        >
          <span className="text-accent">⚡</span> dev
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
        sign in
      </Button>
    </div>
  );
}
