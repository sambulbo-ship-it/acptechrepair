import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple email validation regex
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RepairRequestInput {
  provider_id: string;
  client_email: string;
  client_name?: string;
  client_phone?: string;
  brand: string;
  model?: string;
  description: string;
}

function validateInput(input: unknown): { valid: boolean; error?: string; data?: RepairRequestInput } {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const data = input as Record<string, unknown>;

  // Validate provider_id (required, UUID)
  if (!data.provider_id || typeof data.provider_id !== 'string') {
    return { valid: false, error: 'provider_id is required' };
  }
  if (!uuidRegex.test(data.provider_id)) {
    return { valid: false, error: 'provider_id must be a valid UUID' };
  }

  // Validate client_email (required, valid email, max 255)
  if (!data.client_email || typeof data.client_email !== 'string') {
    return { valid: false, error: 'client_email is required' };
  }
  const email = data.client_email.trim();
  if (email.length > 255) {
    return { valid: false, error: 'client_email must be less than 255 characters' };
  }
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'client_email must be a valid email address' };
  }

  // Validate brand (required, 1-100 chars)
  if (!data.brand || typeof data.brand !== 'string') {
    return { valid: false, error: 'brand is required' };
  }
  const brand = data.brand.trim();
  if (brand.length < 1 || brand.length > 100) {
    return { valid: false, error: 'brand must be between 1 and 100 characters' };
  }

  // Validate description (required, 10-2000 chars)
  if (!data.description || typeof data.description !== 'string') {
    return { valid: false, error: 'description is required' };
  }
  const description = data.description.trim();
  if (description.length < 10) {
    return { valid: false, error: 'description must be at least 10 characters' };
  }
  if (description.length > 2000) {
    return { valid: false, error: 'description must be less than 2000 characters' };
  }

  // Validate client_name (optional, max 100 chars)
  let clientName: string | null = null;
  if (data.client_name) {
    if (typeof data.client_name !== 'string') {
      return { valid: false, error: 'client_name must be a string' };
    }
    clientName = data.client_name.trim();
    if (clientName.length > 100) {
      return { valid: false, error: 'client_name must be less than 100 characters' };
    }
  }

  // Validate client_phone (optional, max 20 chars)
  let clientPhone: string | null = null;
  if (data.client_phone) {
    if (typeof data.client_phone !== 'string') {
      return { valid: false, error: 'client_phone must be a string' };
    }
    clientPhone = data.client_phone.trim();
    if (clientPhone.length > 20) {
      return { valid: false, error: 'client_phone must be less than 20 characters' };
    }
  }

  // Validate model (optional, max 100 chars)
  let model: string | null = null;
  if (data.model) {
    if (typeof data.model !== 'string') {
      return { valid: false, error: 'model must be a string' };
    }
    model = data.model.trim();
    if (model.length > 100) {
      return { valid: false, error: 'model must be less than 100 characters' };
    }
  }

  return {
    valid: true,
    data: {
      provider_id: data.provider_id,
      client_email: email,
      client_name: clientName || undefined,
      client_phone: clientPhone || undefined,
      brand,
      model: model || undefined,
      description,
    },
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate input
    const body = await req.json();
    const validation = validateInput(body);

    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const input = validation.data!;

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the provider exists and is visible
    const { data: provider, error: providerError } = await supabase
      .from("repair_service_providers")
      .select("id, is_visible")
      .eq("id", input.provider_id)
      .single();

    if (providerError || !provider) {
      return new Response(JSON.stringify({ error: "Provider not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!provider.is_visible) {
      return new Response(JSON.stringify({ error: "Provider is not accepting requests" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert the repair request
    const { data: request, error: insertError } = await supabase
      .from("repair_requests")
      .insert({
        provider_id: input.provider_id,
        client_email: input.client_email,
        client_name: input.client_name || null,
        client_phone: input.client_phone || null,
        brand: input.brand,
        model: input.model || null,
        description: input.description,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to submit request" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: request.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});