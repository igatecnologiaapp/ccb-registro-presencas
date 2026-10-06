import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/e/$eventToken")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso ao evento — Registros de Presenças CCB" },
      {
        name: "description",
        content: "Acesso autenticado ao formulário de registro de um evento específico.",
      },
      { property: "og:title", content: "Acesso ao evento — Registros de Presenças CCB" },
      {
        property: "og:description",
        content: "Acesso autenticado ao registro de presenças do evento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async ({ params }) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      window.sessionStorage.setItem("rtm.returnTo", `/e/${params.eventToken}`);
      throw redirect({ to: "/auth" });
    }

    const { data: event } = await supabase
      .from("events")
      .select("id, event_type")
      .eq("public_token", params.eventToken)
      .maybeSingle();

    if (!event) throw redirect({ to: "/presencas" });
    const destination = event.event_type === "treinamento" ? "/treinamento" : "/presencas";
    throw redirect({
      to: destination,
      search: { event: event.id, lock: "1" },
    });
  },
});