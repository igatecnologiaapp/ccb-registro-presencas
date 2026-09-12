import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import logoCcb from "@/assets/logo-ccb.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Registros de Presenças CCB" },
      {
        name: "description",
        content:
          "Acesso restrito ao sistema de registro de presenças das reuniões técnicas musicais.",
      },
      { property: "og:title", content: "Entrar — Registros de Presenças CCB" },
      {
        property: "og:description",
        content: "Acesso restrito de administradores e operadores ao registro de presenças.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/", replace: true });
  }, [loading, session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      navigate({ to: "/", replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha na autenticação.";
      toast.error(
        message === "Invalid login credentials" ? "E-mail ou senha incorretos." : message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-sidebar flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img
            src={logoCcb.url}
            alt="Logotipo oficial da Congregação Cristã no Brasil"
            width={568}
            height={288}
            className="mx-auto h-auto w-56 max-w-full rounded-md bg-white p-2"
          />
          <p className="text-sidebar-foreground/60 mt-4 text-[10px] tracking-[0.18em] uppercase">
            Congregação Cristã no Brasil
          </p>
          <h1 className="doc-title text-sidebar-foreground mt-1 text-xl">
            Registros de Presenças
          </h1>
        </div>

        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <>
              <h2 className="text-base font-semibold">Entrar no sistema</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Acesso restrito a Administradores e Colaboradores cadastrados.
              </p>
              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
          </>
        </div>
      </div>
    </div>
  );
}
