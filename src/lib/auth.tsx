import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "operator";

type AuthValue = {
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  displayName: string;
  isAdmin: boolean;
  roleLoading: boolean;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Sessão pode apontar para um usuário removido: valida antes de usar.
        const { error } = await supabase.auth.getUser();
        if (error) {
          await supabase.auth.signOut({ scope: "local" });
          setSession(null);
          setLoading(false);
          return;
        }
      }
      setSession(data.session);
      setLoading(false);
    })();
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  const meQuery = useQuery({
    queryKey: ["me", userId],
    enabled: !!userId,
    queryFn: async () => {
      // Garante perfil + papel (primeiro usuário do sistema recebe Administrador)
      await supabase.rpc("bootstrap_current_user", { _display_name: "" });
      const [profile, roles] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", userId!).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId!),
      ]);
      const list = (roles.data ?? []).map((r) => r.role as AppRole);
      const role: AppRole | null = list.includes("admin")
        ? "admin"
        : list.includes("operator")
          ? "operator"
          : null;
      return { displayName: profile.data?.display_name ?? "", role };
    },
  });

  const value: AuthValue = {
    session,
    loading,
    role: meQuery.data?.role ?? null,
    displayName: meQuery.data?.displayName ?? "",
    isAdmin: meQuery.data?.role === "admin",
    roleLoading: !!userId && meQuery.isPending,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}
