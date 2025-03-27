// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import nodemailer from "npm:nodemailer@6.9.12"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, text, attachment } = await req.json();

    // Hole SMTP-Konfiguration aus der Datenbank
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: smtpConfig, error: smtpError } = await supabaseClient
      .from('smtp_config')
      .select('*')
      .single();

    if (smtpError || !smtpConfig) {
      throw new Error('SMTP-Konfiguration nicht gefunden. Bitte konfigurieren Sie zuerst Ihre E-Mail-Einstellungen.');
    }

    // Erstelle E-Mail-Transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
    });

    // E-Mail-Optionen
    const mailOptions = {
      from: smtpConfig.from_email,
      to,
      subject,
      text,
      attachments: attachment ? [{
        filename: attachment.filename,
        content: Buffer.from(attachment.content, 'base64'),
        contentType: attachment.filename.endsWith('.csv') ? 'text/csv' : 'application/octet-stream'
      }] : []
    };

    // Sende E-Mail
    const info = await transporter.sendMail(mailOptions);
    console.log('E-Mail gesendet:', info.messageId);

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 