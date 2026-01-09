-- =====================================================
-- TABLA DE CARRITO MEJORADA
-- =====================================================
-- Versión actualizada con mejores funcionalidades

-- Eliminar tabla antigua si existe (cuidado en producción)
DROP TABLE IF EXISTS carrito CASCADE;

-- Crear tabla de carrito
CREATE TABLE carrito (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platillo_id UUID NOT NULL REFERENCES platillos(id) ON DELETE CASCADE,
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0 AND cantidad <= 50),
  precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  -- Restricción: un usuario no puede tener el mismo platillo duplicado en el carrito
  UNIQUE(usuario_id, platillo_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_carrito_usuario ON carrito(usuario_id);
CREATE INDEX idx_carrito_platillo ON carrito(platillo_id);
CREATE INDEX idx_carrito_restaurante ON carrito(restaurante_id);
CREATE INDEX idx_carrito_creado ON carrito(creado_en);

-- =====================================================
-- TRIGGERS Y FUNCIONES
-- =====================================================

-- Trigger para actualizar campo actualizado_en
CREATE OR REPLACE FUNCTION actualizar_carrito_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_carrito_timestamp
  BEFORE UPDATE ON carrito
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_carrito_timestamp();

-- Función para validar que el precio_unitario coincida con el precio actual del platillo
CREATE OR REPLACE FUNCTION validar_precio_platillo()
RETURNS TRIGGER AS $$
DECLARE
  v_precio_actual DECIMAL(10,2);
BEGIN
  -- Obtener precio actual del platillo
  SELECT precio INTO v_precio_actual
  FROM platillos
  WHERE id = NEW.platillo_id;
  
  -- Si el precio no coincide, actualizar al precio actual
  IF v_precio_actual IS NOT NULL AND NEW.precio_unitario != v_precio_actual THEN
    NEW.precio_unitario := v_precio_actual;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_precio_platillo
  BEFORE INSERT OR UPDATE ON carrito
  FOR EACH ROW
  EXECUTE FUNCTION validar_precio_platillo();

-- =====================================================
-- POLÍTICAS RLS PARA CARRITO
-- =====================================================
ALTER TABLE carrito ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden ver su carrito" ON carrito;
DROP POLICY IF EXISTS "Usuarios pueden agregar a su carrito" ON carrito;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su carrito" ON carrito;
DROP POLICY IF EXISTS "Usuarios pueden eliminar de su carrito" ON carrito;

-- El usuario solo puede ver su propio carrito
CREATE POLICY "Usuarios pueden ver su carrito"
  ON carrito FOR SELECT
  USING (auth.uid() = usuario_id);

-- El usuario solo puede insertar en su propio carrito
CREATE POLICY "Usuarios pueden agregar a su carrito"
  ON carrito FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- El usuario solo puede actualizar su propio carrito
CREATE POLICY "Usuarios pueden actualizar su carrito"
  ON carrito FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- El usuario solo puede eliminar de su propio carrito
CREATE POLICY "Usuarios pueden eliminar de su carrito"
  ON carrito FOR DELETE
  USING (auth.uid() = usuario_id);

-- =====================================================
-- VISTAS PARA CARRITO
-- =====================================================

-- Vista completa del carrito con información de platillos y restaurantes
CREATE OR REPLACE VIEW vista_carrito AS
SELECT 
  c.id,
  c.usuario_id,
  c.platillo_id,
  c.restaurante_id,
  c.cantidad,
  c.precio_unitario,
  c.notas,
  c.creado_en,
  c.actualizado_en,
  p.nombre as platillo_nombre,
  p.descripcion as platillo_descripcion,
  p.imagen_url as platillo_imagen,
  p.disponible as platillo_disponible,
  r.nombre as restaurante_nombre,
  r.emoji as restaurante_emoji,
  r.activo as restaurante_activo,
  r.tiempo_entrega_min,
  r.costo_envio,
  (c.cantidad * c.precio_unitario) as subtotal
FROM carrito c
INNER JOIN platillos p ON c.platillo_id = p.id
INNER JOIN restaurantes r ON c.restaurante_id = r.id
ORDER BY c.creado_en DESC;

-- Vista de resumen del carrito por usuario
CREATE OR REPLACE VIEW vista_resumen_carrito AS
SELECT 
  c.usuario_id,
  COUNT(DISTINCT c.id) as total_items,
  SUM(c.cantidad) as cantidad_total,
  SUM(c.cantidad * c.precio_unitario) as subtotal_productos,
  MIN(r.costo_envio) as costo_envio,
  SUM(c.cantidad * c.precio_unitario) + COALESCE(MIN(r.costo_envio), 0) as total_carrito,
  STRING_AGG(DISTINCT r.nombre, ', ') as restaurante_nombre,
  STRING_AGG(DISTINCT r.emoji, '') as restaurante_emoji,
  COUNT(DISTINCT c.restaurante_id) = 1 as un_solo_restaurante,
  MIN(r.tiempo_entrega_min) as tiempo_entrega_estimado
FROM carrito c
INNER JOIN restaurantes r ON c.restaurante_id = r.id
GROUP BY c.usuario_id;

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para agregar o actualizar item en el carrito
CREATE OR REPLACE FUNCTION agregar_al_carrito(
  p_usuario_id UUID,
  p_platillo_id UUID,
  p_cantidad INTEGER DEFAULT 1,
  p_notas TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_restaurante_id UUID;
  v_precio DECIMAL(10,2);
  v_carrito_id UUID;
  v_disponible BOOLEAN;
BEGIN
  -- Verificar que el platillo existe y está disponible
  SELECT p.restaurante_id, p.precio, p.disponible
  INTO v_restaurante_id, v_precio, v_disponible
  FROM platillos p
  WHERE p.id = p_platillo_id;
  
  IF v_restaurante_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Platillo no encontrado');
  END IF;
  
  IF NOT v_disponible THEN
    RETURN json_build_object('success', false, 'message', 'Platillo no disponible');
  END IF;
  
  -- Insertar o actualizar el item en el carrito
  INSERT INTO carrito (usuario_id, platillo_id, restaurante_id, cantidad, precio_unitario, notas)
  VALUES (p_usuario_id, p_platillo_id, v_restaurante_id, p_cantidad, v_precio, p_notas)
  ON CONFLICT (usuario_id, platillo_id)
  DO UPDATE SET
    cantidad = carrito.cantidad + p_cantidad,
    precio_unitario = v_precio,
    notas = COALESCE(p_notas, carrito.notas),
    actualizado_en = NOW()
  RETURNING id INTO v_carrito_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Producto agregado al carrito',
    'carrito_id', v_carrito_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar carrito del usuario
CREATE OR REPLACE FUNCTION limpiar_carrito_usuario(p_usuario_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM carrito WHERE usuario_id = p_usuario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas del carrito
CREATE OR REPLACE FUNCTION obtener_estadisticas_carrito(p_usuario_id UUID)
RETURNS JSON AS $$
DECLARE
  v_total_items INTEGER;
  v_total_productos DECIMAL(10,2);
  v_costo_envio DECIMAL(10,2);
  v_total_final DECIMAL(10,2);
  v_un_solo_restaurante BOOLEAN;
BEGIN
  SELECT 
    COUNT(*),
    COALESCE(SUM(cantidad * precio_unitario), 0),
    COALESCE(MIN(r.costo_envio), 0),
    COALESCE(SUM(cantidad * precio_unitario), 0) + COALESCE(MIN(r.costo_envio), 0),
    COUNT(DISTINCT restaurante_id) = 1
  INTO 
    v_total_items,
    v_total_productos,
    v_costo_envio,
    v_total_final,
    v_un_solo_restaurante
  FROM carrito c
  LEFT JOIN restaurantes r ON c.restaurante_id = r.id
  WHERE c.usuario_id = p_usuario_id;
  
  RETURN json_build_object(
    'total_items', COALESCE(v_total_items, 0),
    'subtotal', COALESCE(v_total_productos, 0),
    'costo_envio', COALESCE(v_costo_envio, 0),
    'total', COALESCE(v_total_final, 0),
    'un_solo_restaurante', COALESCE(v_un_solo_restaurante, false)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para validar que el carrito esté listo para checkout
CREATE OR REPLACE FUNCTION validar_carrito_checkout(p_usuario_id UUID)
RETURNS JSON AS $$
DECLARE
  v_items_invalidos INTEGER;
  v_mensaje TEXT;
BEGIN
  -- Verificar si hay platillos no disponibles o restaurantes inactivos
  SELECT COUNT(*)
  INTO v_items_invalidos
  FROM carrito c
  INNER JOIN platillos p ON c.platillo_id = p.id
  INNER JOIN restaurantes r ON c.restaurante_id = r.id
  WHERE c.usuario_id = p_usuario_id
    AND (NOT p.disponible OR NOT r.activo);
  
  IF v_items_invalidos > 0 THEN
    v_mensaje := 'Hay productos en tu carrito que ya no están disponibles';
    RETURN json_build_object(
      'valid', false,
      'message', v_mensaje,
      'items_invalidos', v_items_invalidos
    );
  END IF;
  
  -- Verificar que todos los items sean del mismo restaurante
  IF (SELECT COUNT(DISTINCT restaurante_id) FROM carrito WHERE usuario_id = p_usuario_id) > 1 THEN
    v_mensaje := 'Solo puedes ordenar de un restaurante a la vez';
    RETURN json_build_object(
      'valid', false,
      'message', v_mensaje
    );
  END IF;
  
  RETURN json_build_object('valid', true, 'message', 'Carrito válido');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE carrito IS 'Almacena los items temporales del carrito de compras de cada usuario';
COMMENT ON COLUMN carrito.usuario_id IS 'ID del usuario propietario del carrito';
COMMENT ON COLUMN carrito.platillo_id IS 'ID del platillo agregado al carrito';
COMMENT ON COLUMN carrito.restaurante_id IS 'ID del restaurante del platillo';
COMMENT ON COLUMN carrito.cantidad IS 'Cantidad del platillo (máximo 50 por seguridad)';
COMMENT ON COLUMN carrito.precio_unitario IS 'Precio unitario del platillo al momento de agregarlo';
COMMENT ON COLUMN carrito.notas IS 'Notas especiales del cliente para este item';
