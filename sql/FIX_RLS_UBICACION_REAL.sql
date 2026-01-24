-- =====================================================
-- POLÍTICAS RLS PARA TABLA ubicacion_real
-- =====================================================
-- Este archivo configura los permisos necesarios para que
-- clientes y repartidores puedan ver y actualizar ubicaciones

-- Habilitar RLS si no está habilitado
ALTER TABLE ubicacion_real ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "Usuarios pueden ver su propia ubicación" ON ubicacion_real;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propia ubicación" ON ubicacion_real;
DROP POLICY IF EXISTS "Usuarios pueden insertar su propia ubicación" ON ubicacion_real;
DROP POLICY IF EXISTS "Usuarios pueden ver ubicaciones de pedidos relacionados" ON ubicacion_real;

-- =====================================================
-- POLÍTICAS PARA USUARIOS (VER SU PROPIA UBICACIÓN)
-- =====================================================

-- Permitir que los usuarios vean su propia ubicación
CREATE POLICY "Usuarios pueden ver su propia ubicación"
  ON ubicacion_real FOR SELECT
  USING (auth.uid() = usuario_id);

-- Permitir que los usuarios actualicen su propia ubicación
CREATE POLICY "Usuarios pueden actualizar su propia ubicación"
  ON ubicacion_real FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Permitir que los usuarios inserten su propia ubicación
CREATE POLICY "Usuarios pueden insertar su propia ubicación"
  ON ubicacion_real FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- =====================================================
-- POLÍTICAS PARA VER UBICACIONES DE PEDIDOS
-- =====================================================

-- Permitir que clientes y repartidores vean ubicaciones relacionadas con sus pedidos
CREATE POLICY "Usuarios pueden ver ubicaciones de pedidos relacionados"
  ON ubicacion_real FOR SELECT
  USING (
    -- El usuario es el cliente del pedido
    EXISTS (
      SELECT 1 FROM pedidos p
      WHERE (p.usuario_id = auth.uid() OR p.repartidor_id = auth.uid())
      AND (p.usuario_id = ubicacion_real.usuario_id OR p.repartidor_id = ubicacion_real.usuario_id)
    )
    OR
    -- El usuario es el repartidor del pedido
    EXISTS (
      SELECT 1 FROM repartidores r
      WHERE r.usuario_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM pedidos p
        WHERE p.repartidor_id = r.usuario_id
        AND (p.usuario_id = ubicacion_real.usuario_id OR p.repartidor_id = ubicacion_real.usuario_id)
      )
    )
  );

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'ubicacion_real'
ORDER BY policyname;

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS configuradas correctamente para ubicacion_real';
END $$;
