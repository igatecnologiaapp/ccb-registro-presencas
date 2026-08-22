import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingBlock } from "@/components/report-blocks";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, roleLoading, roleError } = useAuth();

  if (roleLoading) return <LoadingBlock />;

  if (roleError) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <div className="bg-destructive/10 text-destructive mx-auto flex size-12 items-center justify-center rounded-xl">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">Não foi possível validar seu perfil</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Atualize a página para tentar novamente. Se o problema continuar, encerre a sessão e
          entre novamente.
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <div className="bg-muted text-muted-foreground mx-auto flex size-12 items-center justify-center rounded-xl">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">Acesso restrito</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Esta área de cadastros é exclusiva do perfil <strong>Administrador</strong>. Seu perfil
          atual permite registrar presenças e consultar relatórios.
        </p>
        <Button asChild className="mt-6">
          <Link to="/presencas">Ir para o registro de presenças</Link>
        </Button>
      </div>
    );
  }

  return <Outlet />;
}
