import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ShieldOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SelectedEventProvider } from "@/components/event-context";
import { AppShell } from "@/components/app-shell";
import { useAuth, useSignOut } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function BlockedAccess() {
  const signOut = useSignOut();
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-xl">
        <ShieldOff className="size-6" />
      </div>
      <h1 className="mt-4 text-lg font-semibold">Acesso bloqueado</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Seu acesso ao sistema está desativado. Procure um Administrador para liberar novamente.
      </p>
      <Button
        variant="outline"
        className="mt-6"
        onClick={() => {
          void signOut();
        }}
      >
        Sair
      </Button>
    </div>
  );
}

function AuthenticatedLayout() {
  const { active, roleLoading } = useAuth();

  if (!roleLoading && !active) return <BlockedAccess />;

  return (
    <SelectedEventProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </SelectedEventProvider>
  );
}
