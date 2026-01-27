import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanResult {
  detected: boolean;
  brand?: string;
  model?: string;
  serial_number?: string;
  category?: string;
  confidence: number;
  existing_machine?: {
    id: string;
    name: string;
    brand: string;
    model: string;
    serial_number: string;
  };
  raw_text?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const body = await req.json();
    const { images, workspace_id } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one image is required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (!workspace_id) {
      return new Response(JSON.stringify({ error: 'workspace_id is required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log('[ai-product-scanner] Processing', images.length, 'images for workspace', workspace_id);

    // Build image content for vision model
    const imageContents = images.map((img: string) => ({
      type: "image_url",
      image_url: {
        url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`
      }
    }));

    // Call Lovable AI Gateway with vision model
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert at identifying professional audio, video, and lighting equipment from photos.
Your task is to analyze product images and extract:
1. Brand name (manufacturer)
2. Model name/number
3. Serial number (if visible)
4. Category (one of: mixing-console, amplifier, speaker, lighting, controller, computer, video, microphone, peripheral, other)

Known professional brands include:
- Audio: Shure, Sennheiser, Neumann, AKG, Audio-Technica, Yamaha, Midas, Allen & Heath, Behringer, QSC, d&b audiotechnik, L-Acoustics, Martin Audio, Meyer Sound, JBL
- Lighting: Martin, Clay Paky, Robe, Ayrton, ETC, Chauvet, High End Systems, GLP
- Video: Blackmagic, Barco, Christie, Sony, Panasonic, Roland
- Controllers: grandMA, Avolites, ChamSys

Respond ONLY with a JSON object in this exact format:
{
  "detected": true/false,
  "brand": "detected brand or null",
  "model": "detected model or null", 
  "serial_number": "detected serial number or null",
  "category": "category id or null",
  "confidence": 0.0-1.0,
  "raw_text": "any visible text on the product"
}

If you cannot identify the product, set detected to false and confidence to 0.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze these product images and identify the equipment. Extract brand, model, serial number, and category. If there are multiple images, they show different angles of the same product.'
              },
              ...imageContents
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[ai-product-scanner] AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), { 
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), { 
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    console.log('[ai-product-scanner] AI response:', content);

    // Parse the JSON response
    let scanResult: ScanResult;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      scanResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[ai-product-scanner] Failed to parse AI response:', parseError);
      scanResult = {
        detected: false,
        confidence: 0,
        raw_text: content
      };
    }

    // If we detected a serial number, check if it exists in the workspace
    if (scanResult.detected && scanResult.serial_number) {
      const { data: existingMachine } = await supabase
        .from('machines')
        .select('id, name, brand, model, serial_number')
        .eq('workspace_id', workspace_id)
        .ilike('serial_number', scanResult.serial_number)
        .limit(1)
        .single();

      if (existingMachine) {
        scanResult.existing_machine = existingMachine;
        console.log('[ai-product-scanner] Found existing machine:', existingMachine.id);
      }
    }

    // If no serial but we have brand/model, try to find similar products
    if (scanResult.detected && !scanResult.existing_machine && scanResult.brand && scanResult.model) {
      const { data: similarMachines } = await supabase
        .from('machines')
        .select('id, name, brand, model, serial_number')
        .eq('workspace_id', workspace_id)
        .ilike('brand', `%${scanResult.brand}%`)
        .ilike('model', `%${scanResult.model}%`)
        .limit(5);

      if (similarMachines && similarMachines.length > 0) {
        // Add hint about similar products
        scanResult.raw_text = (scanResult.raw_text || '') + 
          `\n[Found ${similarMachines.length} similar product(s) in stock]`;
      }
    }

    return new Response(JSON.stringify(scanResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[ai-product-scanner] Error:', err);
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      detected: false,
      confidence: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
