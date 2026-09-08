import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { LoadingBlock } from "@/components/report-blocks";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, roleLoading, roleError } = useAuth();
  const navigate = useNavigate();

  // Perfil Colaborador não acessa telas administrativas, nem digitando o endereço.
  useEffect(() => {
    if (!roleLoading && !roleError && !isAdmin) {
      void navigate({ to: "/presencas", replace: true });
    }
  }, [isAdmin, roleLoading, roleError, navigate]);

  if (roleLoading) return <LoadingBlock />;

  if (roleError) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <div className="bg-destructive/10 text-destructive mx-auto flex size-12 items-center justify-center rounded-xl">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">Não foi possível validar seu perfil</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Atualize a página para tentar novamente. Se o problema continuar, encerre a sessão e entre
          novamente.
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
          Esta área é exclusiva do perfil <strong>Administrador</strong>. Redirecionando para o
          registro de presenças…
        </p>
      </div>
    );
  }

  return <Outlet />;
}
