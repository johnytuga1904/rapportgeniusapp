import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { toast } from 'sonner';

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from_email: string;
}

export function SMTPConfig() {
  const [config, setConfig] = useState<SMTPConfig>({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    from_email: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('smtp_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der SMTP-Konfiguration:', error);
      toast.error('Fehler beim Laden der E-Mail-Einstellungen');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Benutzer nicht gefunden');

      const { error } = await supabase
        .from('smtp_config')
        .upsert({
          user_id: user.id,
          ...config,
        });

      if (error) throw error;

      toast.success('E-Mail-Einstellungen gespeichert');
    } catch (error) {
      console.error('Fehler beim Speichern der SMTP-Konfiguration:', error);
      toast.error('Fehler beim Speichern der E-Mail-Einstellungen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="host">SMTP-Server</Label>
        <Input
          id="host"
          value={config.host}
          onChange={(e) => setConfig({ ...config, host: e.target.value })}
          placeholder="z.B. smtp.gmail.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="port">Port</Label>
        <Input
          id="port"
          type="number"
          value={config.port}
          onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="secure"
          checked={config.secure}
          onCheckedChange={(checked) => setConfig({ ...config, secure: checked })}
        />
        <Label htmlFor="secure">TLS/SSL verwenden</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Benutzername</Label>
        <Input
          id="username"
          value={config.username}
          onChange={(e) => setConfig({ ...config, username: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          type="password"
          value={config.password}
          onChange={(e) => setConfig({ ...config, password: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="from_email">Absender-E-Mail</Label>
        <Input
          id="from_email"
          type="email"
          value={config.from_email}
          onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
          required
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Speichern...' : 'E-Mail-Einstellungen speichern'}
      </Button>
    </form>
  );
} 