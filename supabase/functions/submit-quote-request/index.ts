import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Simple email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Rate limiting - max 5 requests per email per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(email: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = email.toLowerCase();
  const existing = rateLimitMap.get(key);
  
  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  
  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  existing.count++;
  return { allowed: true };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean every minute

interface QuoteRequestInput {
  workspace_id: string;
  machine_id: string;
  machine_name: string;
  machine_brand?: string | null;
  machine_model?: string | null;
  client_name: string;
  client_email: string;
  client_phone?: string | null;
  client_company?: string | null;
  request_type: 'rental' | 'sale' | 'repair';
  message: string;
}

function validateInput(data: unknown): { valid: boolean; error?: string; data?: QuoteRequestInput } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const input = data as Record<string, unknown>;

  // Required fields
  if (!input.workspace_id || typeof input.workspace_id !== 'string' || !uuidRegex.test(input.workspace_id)) {
    return { valid: false, error: 'Invalid workspace_id' };
  }

  if (!input.machine_id || typeof input.machine_id !== 'string' || !uuidRegex.test(input.machine_id)) {
    return { valid: false, error: 'Invalid machine_id' };
  }

  if (!input.machine_name || typeof input.machine_name !== 'string' || input.machine_name.length < 1 || input.machine_name.length > 200) {
    return { valid: false, error: 'Invalid machine_name' };
  }

  if (!input.client_name || typeof input.client_name !== 'string' || input.client_name.length < 2 || input.client_name.length > 100) {
    return { valid: false, error: 'Invalid client_name (2-100 characters)' };
  }

  if (!input.client_email || typeof input.client_email !== 'string' || !emailRegex.test(input.client_email) || input.client_email.length > 255) {
    return { valid: false, error: 'Invalid client_email' };
  }

  if (!input.request_type || !['rental', 'sale', 'repair'].includes(input.request_type as string)) {
    return { valid: false, error: 'Invalid request_type (must be rental, sale, or repair)' };
  }

  if (!input.message || typeof input.message !== 'string' || input.message.length < 10 || input.message.length > 2000) {
    return { valid: false, error: 'Invalid message (10-2000 characters)' };
  }

  // Optional fields validation
  if (input.client_phone && (typeof input.client_phone !== 'string' || input.client_phone.length > 20)) {
    return { valid: false, error: 'Invalid client_phone' };
  }

  if (input.client_company && (typeof input.client_company !== 'string' || input.client_company.length > 100)) {
    return { valid: false, error: 'Invalid client_company' };
  }

  return {
    valid: true,
    data: {
      workspace_id: input.workspace_id as string,
      machine_id: input.machine_id as string,
      machine_name: input.machine_name as string,
      machine_brand: input.machine_brand as string | null | undefined,
      machine_model: input.machine_model as string | null | undefined,
      client_name: input.client_name as string,
      client_email: input.client_email as string,
      client_phone: input.client_phone as string | null | undefined,
      client_company: input.client_company as string | null | undefined,
      request_type: input.request_type as 'rental' | 'sale' | 'repair',
      message: input.message as string,
    },
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse and validate input
    const body = await req.json();
    const validation = validateInput(body);

    if (!validation.valid || !validation.data) {
      console.log('[submit-quote-request] Validation failed:', validation.error);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const input = validation.data;

    // Check rate limit
    const rateLimit = checkRateLimit(input.client_email);
    if (!rateLimit.allowed) {
      console.log(`[submit-quote-request] Rate limited: ${input.client_email}`);
      return new Response(JSON.stringify({ 
        error: 'Trop de demandes. Veuillez réessayer plus tard.',
        retry_after: rateLimit.retryAfter 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimit.retryAfter) 
        },
      });
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify workspace exists
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('id', input.workspace_id)
      .single();

    if (workspaceError || !workspace) {
      console.log('[submit-quote-request] Workspace not found:', input.workspace_id);
      return new Response(JSON.stringify({ error: 'Workspace not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store quote request in database
    const { data: quoteRequest, error: insertError } = await supabase
      .from('quote_requests')
      .insert({
        workspace_id: input.workspace_id,
        machine_id: input.machine_id,
        machine_name: input.machine_name,
        machine_brand: input.machine_brand || null,
        machine_model: input.machine_model || null,
        client_name: input.client_name,
        client_email: input.client_email,
        client_phone: input.client_phone || null,
        client_company: input.client_company || null,
        request_type: input.request_type,
        message: input.message,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[submit-quote-request] Insert error:', insertError);
      throw insertError;
    }

    console.log('[submit-quote-request] Quote request created:', quoteRequest.id);

    // Get workspace contact email to send notification
    const { data: provider } = await supabase
      .from('repair_service_providers')
      .select('contact_email, company_name')
      .eq('workspace_id', input.workspace_id)
      .eq('is_visible', true)
      .single();

    // Log the notification (email would be sent here if Resend is configured)
    console.log('[submit-quote-request] Notification would be sent to:', provider?.contact_email || 'no contact configured');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Quote request submitted successfully',
        id: quoteRequest.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    console.error('[submit-quote-request] Error:', errorMessage);

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
