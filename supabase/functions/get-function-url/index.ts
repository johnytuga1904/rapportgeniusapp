// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { functionName } = await req.json();
    
    if (!functionName) {
      throw new Error("Funktionsname ist erforderlich");
    }

    // Supabase URL aus der Umgebungsvariable
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL ist nicht konfiguriert");
    }

    // Erstelle die URL für die angegebene Funktion
    const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;
    
    console.log(`URL für Funktion ${functionName}: ${functionUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        functionUrl 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Fehler beim Abrufen der Funktions-URL:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
