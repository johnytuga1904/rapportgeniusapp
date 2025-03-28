// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.12";
import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse die FormData aus der Anfrage
    const formData = await multiParser(req);
    console.log("Empfangene FormData:", Object.keys(formData.fields));

    // Extrahiere die Daten aus der FormData
    const to = formData.fields.to;
    const subject = formData.fields.subject;
    const text = formData.fields.text;
    const userId = formData.fields.userId;
    const file = formData.files?.file;

    if (!userId) {
      throw new Error("Benutzer-ID ist erforderlich");
    }

    if (!file) {
      throw new Error("Keine Datei gefunden");
    }

    console.log("Datei empfangen:", {
      filename: file.filename,
      contentType: file.contentType,
      size: file.size
    });

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

    // Lese den Dateiinhalt
    const fileContent = await Deno.readAll(file.content);
    
    // E-Mail mit Anhang senden
    const mailOptions = {
      from: smtpConfig.from_email,
      to,
      subject,
      text,
      attachments: [
        {
          filename: file.filename,
          content: fileContent,
          contentType: file.contentType
        }
      ],
    };

    console.log("Sende E-Mail mit Anhang:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      attachmentName: mailOptions.attachments[0].filename,
      attachmentType: mailOptions.attachments[0].contentType,
      attachmentSize: fileContent.length
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
