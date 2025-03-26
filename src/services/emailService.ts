import { supabase } from '@/lib/supabase';

interface SMTPConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  useTLS: boolean;
  fromEmail: string;
}

class EmailService {
  async sendEmail(to: string, subject: string, html: string) {
    try {
      // Hole den aktuellen Benutzer
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Nicht eingeloggt');

      // Sende E-Mail über Edge Function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          html,
          userId: user.id
        }
      });

      if (error) throw error;
      console.log('E-Mail erfolgreich gesendet:', data);
      return data;

    } catch (error) {
      console.error('Fehler beim Senden der E-Mail:', error);
      throw error;
    }
  }

  async sendReport(to: string, report: any) {
    try {
      const subject = `Arbeitsrapport: ${report.name} - ${report.period}`;
      
      // HTML-Template für den Report
      const html = `
        <h2>Arbeitsrapport für ${report.name}</h2>
        <p><strong>Zeitraum:</strong> ${report.period}</p>
        
        <h3>Einträge:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left;">Datum</th>
              <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left;">Tätigkeit</th>
              <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">Stunden</th>
            </tr>
          </thead>
          <tbody>
            ${report.entries.map((entry: any) => `
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb;">${entry.date}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb;">${entry.activity || '-'}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">${entry.hours}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f3f4f6;">
              <td colspan="2" style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;"><strong>Gesamtstunden:</strong></td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">
                <strong>${report.entries.reduce((total: number, entry: any) => total + parseFloat(entry.hours || 0), 0).toFixed(2)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
        
        ${report.notes ? `<p><strong>Notizen:</strong><br>${report.notes}</p>` : ''}
      `;

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      console.error('Fehler beim Senden des Reports:', error);
      throw error;
    }
  }

  async sendReportWithAttachment(to: string, report: any, xlsxBuffer: string, filename: string) {
    try {
      const subject = `Arbeitsrapport: ${report.name} - ${report.period}`;
      
      // Simplified HTML-Template for emails with attachments
      const html = `
        <h2>Arbeitsrapport für ${report.name}</h2>
        <p><strong>Zeitraum:</strong> ${report.period}</p>
        
        <p>Im Anhang finden Sie den Arbeitsrapport als CSV-Datei.</p>
        
        ${report.notes ? `<p><strong>Notizen:</strong><br>${report.notes}</p>` : ''}
      `;

      // Hole den aktuellen Benutzer
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Nicht eingeloggt');

      // Sende E-Mail über Edge Function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          html,
          userId: user.id,
          attachments: [{
            filename,
            content: xlsxBuffer,
            encoding: 'base64'
          }]
        }
      });

      if (error) throw error;
      console.log('E-Mail mit Anhang erfolgreich gesendet:', data);
      return data;

    } catch (error) {
      console.error('Fehler beim Senden der E-Mail mit Anhang:', error);
      throw error;
    }
  }
}

// Erstelle eine einzelne Instanz des E-Mail-Services
const emailService = new EmailService();

// Exportiere die Instanz
export { emailService }; 