CREATE TABLE IF NOT EXISTS public.cuentas_bancarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_titular text NOT NULL,
  banco text NOT NULL,
  cuenta text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.cuentas_bancarias (nombre_titular, banco, cuenta)
VALUES
  ('Titular Principal', 'Banco Ejemplo', '0000-0000-0000-0000')
ON CONFLICT DO NOTHING;
