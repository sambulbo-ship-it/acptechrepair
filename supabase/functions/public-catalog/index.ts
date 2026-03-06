import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://acptechrepair.lovable.app";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get("workspace_id");
    const inviteCode = url.searchParams.get("invite_code");
    const format = url.searchParams.get("format");

    // Redirect browsers to catalog UI unless format=json
    const accept = req.headers.get("accept") || "";
    const wantsJson = format === "json" || accept === "application/json";

    if (!wantsJson) {
      const params = inviteCode
        ? `invite_code=${encodeURIComponent(inviteCode)}`
        : workspaceId
          ? `workspace=${encodeURIComponent(workspaceId)}`
          : "";
      const target = params ? `${APP_URL}/catalog?${params}` : `${APP_URL}/catalog`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: target },
      });
    }

    // JSON API mode
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve workspace
    let resolvedWorkspaceId = workspaceId;

    if (!resolvedWorkspaceId && inviteCode) {
      const { data, error } = await supabase.rpc("find_workspace_by_invite_code", {
        _invite_code: inviteCode,
      });
      if (error || !data?.length) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid invite code", machines: [] }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      resolvedWorkspaceId = data[0].id;
    }

    if (!resolvedWorkspaceId) {
      return new Response(
        JSON.stringify({ success: false, error: "workspace_id or invite_code required", machines: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch guest link settings
    const { data: guestSettings } = await supabase
      .from("workspace_settings")
      .select("guest_link_enabled, guest_show_catalog, guest_show_repair_request, guest_show_maintenance_request")
      .eq("workspace_id", resolvedWorkspaceId)
      .maybeSingle();

    const guestConfig = {
      guest_link_enabled: guestSettings?.guest_link_enabled ?? false,
      guest_show_catalog: guestSettings?.guest_show_catalog ?? true,
      guest_show_repair_request: guestSettings?.guest_show_repair_request ?? false,
      guest_show_maintenance_request: guestSettings?.guest_show_maintenance_request ?? false,
    };

    // If guest link is not enabled, deny access
    if (!guestConfig.guest_link_enabled) {
      return new Response(
        JSON.stringify({ success: false, error: "Guest access is not enabled for this workspace", machines: [] }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let machines: any[] = [];

    // Only fetch catalog if enabled
    if (guestConfig.guest_show_catalog) {
      const { data: catalogItems, error: dbError } = await supabase
        .from("rental_sale_config")
        .select(`
          id, available_for_rental, available_for_sale,
          daily_rental_price, weekly_rental_price, monthly_rental_price,
          sale_price, currency, rental_notes, sale_notes,
          machine_id, workspace_id,
          machines!inner ( id, name, brand, model, category, photos, status ),
          workspaces!inner ( id, name, logo_url, primary_color )
        `)
        .eq("workspace_id", resolvedWorkspaceId)
        .or("available_for_rental.eq.true,available_for_sale.eq.true")
        .eq("machines.status", "operational");

      if (dbError) throw dbError;

      machines = (catalogItems || []).map((item: any) => {
        const m = item.machines;
        const w = item.workspaces;
        return {
          id: m.id, name: m.name, brand: m.brand, model: m.model,
          category: m.category, photos: m.photos,
          workspace_name: w.name,
          workspace_logo: w.logo_url, workspace_primary_color: w.primary_color,
          workspace_contact_email: null,
          workspace_phone: null,
          available_for_rental: item.available_for_rental,
          available_for_sale: item.available_for_sale,
          daily_rental_price: item.daily_rental_price,
          weekly_rental_price: item.weekly_rental_price,
          monthly_rental_price: item.monthly_rental_price,
          sale_price: item.sale_price, currency: item.currency,
          in_stock: true,
          rental_notes: item.available_for_rental ? item.rental_notes : null,
          sale_notes: item.available_for_sale ? item.sale_notes : null,
        };
      });
    }

    // Get contact info
    const { data: provider } = await supabase
      .from("repair_service_providers")
      .select("contact_email, phone")
      .eq("workspace_id", resolvedWorkspaceId)
      .eq("is_visible", true)
      .limit(1)
      .single();

    // Attach contact info to machines
    machines = machines.map((m: any) => ({
      ...m,
      workspace_contact_email: provider?.contact_email || null,
      workspace_phone: provider?.phone || null,
    }));

    // Get workspace info
    const { data: wsInfo } = await supabase
      .from("workspaces")
      .select("name, logo_url, primary_color")
      .eq("id", resolvedWorkspaceId)
      .single();

    return new Response(
      JSON.stringify({
        success: true, machines, total: machines.length,
        workspace_id: resolvedWorkspaceId,
        guest_config: guestConfig,
        workspace: wsInfo ? {
          name: wsInfo.name, logo_url: wsInfo.logo_url,
          primary_color: wsInfo.primary_color,
          contact_email: provider?.contact_email || null,
          phone: provider?.phone || null,
        } : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err), machines: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
