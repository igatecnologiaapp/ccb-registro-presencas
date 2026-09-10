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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/", replace: true });
  }, [loading, session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name.trim() },
          },
        });
        if (error) throw error;
        if (data.session) {
          await supabase.rpc("bootstrap_current_user", { _display_name: name.trim() });
          navigate({ to: "/", replace: true });
        } else {
          setSent(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        navigate({ to: "/", replace: true });
      }
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
          {sent ? (
            <div className="space-y-3 text-center">
              <h2 className="text-base font-semibold">Confirme seu e-mail</h2>
              <p className="text-muted-foreground text-sm">
                Enviamos um link de confirmação para <strong>{email}</strong>. Após confirmar,
                volte aqui e faça login.
              </p>
              <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
                Voltar
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold">
                {mode === "signin" ? "Entrar no sistema" : "Criar acesso"}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Acesso restrito a administradores e operadores.
              </p>
              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nome de exibição</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex.: João da Silva"
                      required
                    />
                  </div>
                )}
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
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {mode === "signin" ? "Entrar" : "Criar acesso"}
                </Button>
              </form>
              <p className="text-muted-foreground mt-4 text-center text-sm">
                {mode === "signin" ? "Ainda não tem acesso?" : "Já possui acesso?"}{" "}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? "Criar acesso" : "Entrar"}
                </button>
              </p>
            </>
          )}
        </div>
        <p className="text-sidebar-foreground/50 mt-4 text-center text-xs">
          O primeiro usuário cadastrado recebe o perfil de Administrador.
        </p>
      </div>
    </div>
  );
}
