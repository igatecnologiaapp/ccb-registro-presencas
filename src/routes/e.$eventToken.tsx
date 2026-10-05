import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/e/$eventToken")({
  ssr: false,
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