import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RepairData {
  category: string;
  brand: string | null;
  model: string | null;
  description: string;
  type: string;
  priority: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      machineCategory, 
      machineBrand, 
      machineModel,
      enableWebSearch = false 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch anonymous repair data - NEVER include workspace info
    let repairs: RepairData[] = [];
    
    // Priority 1: Same exact model
    if (machineModel && machineBrand) {
      const { data: modelRepairs } = await supabase
        .from("diagnostic_entries")
        .select(`
          description,
          type,
          priority,
          machines!inner(category, brand, model)
        `)
        .limit(50);

      if (modelRepairs) {
        const exactMatches = modelRepairs.filter((r: any) => 
          r.machines?.model?.toLowerCase() === machineModel.toLowerCase() &&
          r.machines?.brand?.toLowerCase() === machineBrand.toLowerCase()
        );
        repairs = exactMatches.map((r: any) => ({
          category: r.machines?.category || "",
          brand: r.machines?.brand,
          model: r.machines?.model,
          description: r.description,
          type: r.type,
          priority: r.priority,
        }));
      }
    }

    // Priority 2: Same brand, different models
    if (repairs.length < 10 && machineBrand) {
      const { data: brandRepairs } = await supabase
        .from("diagnostic_entries")
        .select(`
          description,
          type,
          priority,
          machines!inner(category, brand, model)
        `)
        .limit(50);

      if (brandRepairs) {
        const brandMatches = brandRepairs.filter((r: any) => 
          r.machines?.brand?.toLowerCase() === machineBrand.toLowerCase() &&
          r.machines?.model?.toLowerCase() !== machineModel?.toLowerCase()
        );
        const newRepairs = brandMatches.map((r: any) => ({
          category: r.machines?.category || "",
          brand: r.machines?.brand,
          model: r.machines?.model,
          description: r.description,
          type: r.type,
          priority: r.priority,
        }));
        repairs = [...repairs, ...newRepairs].slice(0, 30);
      }
    }

    // Priority 3: Same category (equivalent equipment from other brands)
    if (repairs.length < 20 && machineCategory) {
      const { data: categoryRepairs } = await supabase
        .from("diagnostic_entries")
        .select(`
          description,
          type,
          priority,
          machines!inner(category, brand, model)
        `)
        .limit(50);

      if (categoryRepairs) {
        const categoryMatches = categoryRepairs.filter((r: any) => 
          r.machines?.category === machineCategory &&
          r.machines?.brand?.toLowerCase() !== machineBrand?.toLowerCase()
        );
        const newRepairs = categoryMatches.map((r: any) => ({
          category: r.machines?.category || "",
          brand: r.machines?.brand,
          model: r.machines?.model,
          description: r.description,
          type: r.type,
          priority: r.priority,
        }));
        repairs = [...repairs, ...newRepairs].slice(0, 40);
      }
    }

    // Build context for AI - ANONYMIZED (no workspace, no company info)
    const anonymizedRepairContext = repairs.map(r => 
      `[${r.type?.toUpperCase() || 'REPAIR'}] ${r.brand || 'Unknown'} ${r.model || ''}: ${r.description}`
    ).join("\n");

    // System prompt with STRICT privacy rules
    const systemPrompt = `Tu es un assistant technique expert en réparation d'équipements professionnels.

RÈGLES DE CONFIDENTIALITÉ ABSOLUES (TRÈS IMPORTANT):
1. Tu ne dois JAMAIS mentionner quelle entreprise, workspace, ou utilisateur a eu quel problème
2. Tu ne dois JAMAIS révéler d'informations permettant d'identifier une entreprise
3. Tu dois présenter les réparations passées de manière totalement ANONYME
4. Si on te demande "qui a eu ce problème", tu dois refuser poliment en citant la confidentialité
5. Tu peux dire "d'après des interventions passées sur ce type d'équipement" mais JAMAIS "l'entreprise X a eu..."

CONTEXTE DES RÉPARATIONS ANONYMISÉES (historique sans info entreprise):
${anonymizedRepairContext || "Aucun historique de réparation disponible pour cet équipement."}

INSTRUCTIONS:
- Utilise les réparations passées pour donner des conseils pertinents
- Suggère des solutions basées sur les interventions similaires
- Sois précis et technique dans tes réponses
- Si tu ne trouves pas d'info pertinente dans l'historique, donne des conseils généraux basés sur ton expertise

${enableWebSearch ? "L'utilisateur a demandé une recherche web. Tu peux mentionner que des informations supplémentaires pourraient être trouvées en ligne." : "Tu dois te baser UNIQUEMENT sur l'historique des réparations et ton expertise technique. Ne suggère PAS de recherche web sauf si l'utilisateur le demande explicitement."}

Équipement concerné: ${machineBrand || 'Non spécifié'} ${machineModel || ''} (Catégorie: ${machineCategory || 'Non spécifiée'})`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants pour l'IA." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI diagnostic error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
