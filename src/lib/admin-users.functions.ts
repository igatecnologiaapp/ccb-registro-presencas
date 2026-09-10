import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().trim().min(1),
  role: z.enum(["admin", "operator"]),
  sectorId: z.string().uuid().nullable(),
  allPrayerHouses: z.boolean(),
});

export const createAppUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createUserSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Somente Administradores podem criar usuários — verificado com a sessão do chamador.
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Apenas Administradores podem cadastrar usuários.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name: data.displayName },
    });
    if (created.error) throw new Error(created.error.message);
    const userId = created.data.user?.id;
    if (!userId) throw new Error("Não foi possível criar o usuário.");

    const profile = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      display_name: data.displayName,
      email: data.email,
      active: true,
      sector_id: data.role === "admin" ? null : data.sectorId,
      all_prayer_houses: data.role === "admin" ? false : data.allPrayerHouses,
    });
    if (profile.error) throw new Error(profile.error.message);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    const role = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });
    if (role.error) throw new Error(role.error.message);

    return { id: userId };
  });
