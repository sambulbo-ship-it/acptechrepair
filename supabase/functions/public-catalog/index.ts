import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse query parameters for filtering
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get('workspace_id');
    const category = url.searchParams.get('category');
    const type = url.searchParams.get('type'); // 'rental', 'sale', or null for all
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    console.log('[public-catalog] Fetching catalog with params:', { workspaceId, category, type, limit, offset });

    // Require workspace_id for privacy - clients can only see one company's items
    if (!workspaceId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'workspace_id is required',
          machines: [],
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Build the query for rental_sale_config joined with machines and workspaces
    // Only select public-safe fields - NO serial numbers, NO repair dates, NO internal notes
    let query = supabase
      .from('rental_sale_config')
      .select(`
        id,
        available_for_rental,
        available_for_sale,
        daily_rental_price,
        weekly_rental_price,
        monthly_rental_price,
        sale_price,
        currency,
        rental_notes,
        sale_notes,
        machine_id,
        workspace_id,
        machines!inner (
          id,
          name,
          brand,
          model,
          category,
          photos,
          status
        ),
        workspaces!inner (
          id,
          name,
          logo_url,
          primary_color
        )
      `)
      .eq('workspace_id', workspaceId)
      .or('available_for_rental.eq.true,available_for_sale.eq.true');

    // Apply type filters
    if (type === 'rental') {
      query = query.eq('available_for_rental', true);
    } else if (type === 'sale') {
      query = query.eq('available_for_sale', true);
    }

    // Execute query with pagination - only show operational machines (in stock)
    const { data: catalogItems, error } = await query
      .eq('machines.status', 'operational')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[public-catalog] Database error:', error);
      throw error;
    }

    console.log('[public-catalog] Found items:', catalogItems?.length || 0);

    // Get workspace contact info separately (repair_service_providers for contact email)
    const { data: providerData } = await supabase
      .from('repair_service_providers')
      .select('contact_email, phone, company_name')
      .eq('workspace_id', workspaceId)
      .eq('is_visible', true)
      .limit(1)
      .single();

    // Transform the data to a client-friendly format
    // IMPORTANT: Do NOT expose serial_number, location, notes, or internal data
    const machines = (catalogItems || [])
      .filter(item => {
        // Filter by category if specified
        if (category && (item.machines as any)?.category !== category) {
          return false;
        }
        return true;
      })
      .map(item => {
        const machine = item.machines as any;
        const workspace = item.workspaces as any;

        // Determine stock/condition status for clients
        // In stock = operational status
        const inStock = machine.status === 'operational';
        
        // Check if item has sale notes indicating new/used condition
        const isNew = item.sale_notes?.toLowerCase().includes('neuf') || 
                      item.sale_notes?.toLowerCase().includes('new');
        const isUsed = item.sale_notes?.toLowerCase().includes('occasion') ||
                       item.sale_notes?.toLowerCase().includes('used');
        const condition = isNew ? 'new' : (isUsed ? 'used' : 'unspecified');

        return {
          id: machine.id,
          name: machine.name,
          brand: machine.brand,
          model: machine.model,
          category: machine.category,
          photos: machine.photos,
          // Workspace info
          workspace_id: workspace.id,
          workspace_name: workspace.name,
          workspace_logo: workspace.logo_url,
          workspace_primary_color: workspace.primary_color,
          workspace_contact_email: providerData?.contact_email || null,
          workspace_phone: providerData?.phone || null,
          // Rental/Sale info
          available_for_rental: item.available_for_rental,
          available_for_sale: item.available_for_sale,
          daily_rental_price: item.daily_rental_price,
          weekly_rental_price: item.weekly_rental_price,
          monthly_rental_price: item.monthly_rental_price,
          sale_price: item.sale_price,
          currency: item.currency,
          // Stock & condition for clients
          in_stock: inStock,
          condition: condition,
          // Public notes only (filtered)
          rental_notes: item.available_for_rental ? item.rental_notes : null,
          sale_notes: item.available_for_sale ? item.sale_notes : null,
        };
      });

    return new Response(
      JSON.stringify({
        success: true,
        machines,
        total: machines.length,
        limit,
        offset,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    console.error('[public-catalog] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        machines: [],
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
