// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Vereinfachte E-Mail-Optionen ohne Anhänge
interface MailOptions {
  from: string;
  to: string;
  subject: string;
  text: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, text, userId } = await req.json();
    console.log("Empfangene Anfrage:", { to, subject });

    if (!userId) {
      throw new Error("Benutzer-ID ist erforderlich");
    }

    // Supabase Client für SMTP-Config
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // SMTP-Einstellungen abrufen
    const { data: smtpConfig, error: smtpError } = await supabaseClient
      .from("smtp_config")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (smtpError || !smtpConfig) {
      throw new Error("SMTP-Konfiguration nicht gefunden.");
    }

    console.log("SMTP-Konfiguration geladen:", { host: smtpConfig.host, port: smtpConfig.port });

    // E-Mail-Transporter erstellen
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
    });

    // E-Mail-Optionen vorbereiten (ohne Anhang)
    const mailOptions: MailOptions = {
      from: smtpConfig.from_email,
      to,
      subject,
      text,
    };

    console.log("Sende E-Mail mit folgenden Optionen:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("E-Mail erfolgreich gesendet:", info.messageId);

      return new Response(
        JSON.stringify({ success: true, messageId: info.messageId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (sendError) {
      console.error("Fehler beim Senden der E-Mail:", sendError);
      throw new Error(`Fehler beim Senden der E-Mail: ${sendError.message}`);
    }
  } catch (error) {
    console.error("Fehler beim Senden der E-Mail:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});