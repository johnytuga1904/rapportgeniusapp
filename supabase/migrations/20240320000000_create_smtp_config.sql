-- Create SMTP configuration table
CREATE TABLE IF NOT EXISTS smtp_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    secure BOOLEAN DEFAULT false,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    from_email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE smtp_config ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access their own SMTP config
CREATE POLICY "Users can access their own smtp_config" ON smtp_config
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow service role to access all SMTP configs
CREATE POLICY "Service role can access all smtp_config" ON smtp_config
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_smtp_config_updated_at
    BEFORE UPDATE ON smtp_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 