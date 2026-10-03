import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/e/$eventId")({
  beforeLoad: async ({ params }) => {
    const { eventId } = params;
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw redirect({
        to: "/auth",
        search: { redirect: `/e/${eventId}` },
      });
    }

    // Get event to determine type
    const { data: event } = await supabase
      .from("events")
      .select("event_type")
      .eq("id", eventId)
      .single();

    if (!event) {
      throw redirect({ to: "/" });
    }

    // We store the lock in a temporary session storage or just via search params
    // But for a \"minimal frontend change\", we'll use search params to signal the lock.
    const destination = event.event_type === \"treinamento\" ? \"/treinamento\" : \"/presencas\";
    
    throw redirect({
      to: destination,
      search: {
        event: eventId,
        lock: \"1\",
      },
    });
  },
});
