-- =====================================================
-- TABLA DE UBICACIONES EN TIEMPO REAL
-- =====================================================
-- Almacena ubicaciones actuales de cliente, repartidor y restaurante por pedido

CREATE TABLE IF NOT EXISTS ubicacion_real (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  
  -- Ubicación del Cliente
  cliente_latitud DECIMAL(10,8),
  cliente_longitud DECIMAL(11,8),
  cliente_actualizado_en TIMESTAMPTZ,
  
  -- Ubicación del Repartidor
  repartidor_latitud DECIMAL(10,8),
  repartidor_longitud DECIMAL(11,8),
  repartidor_velocidad DECIMAL(5,2), -- km/h
  repartidor_actualizado_en TIMESTAMPTZ,
  
  -- Ubicación del Restaurante (fija generalmente)
  restaurante_latitud DECIMAL(10,8),
  restaurante_longitud DECIMAL(11,8),
  
  -- Metadata
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(pedido_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ubicacion_real_pedido ON ubicacion_real(pedido_id);
CREATE INDEX IF NOT EXISTS idx_ubicacion_real_actualizado ON ubicacion_real(actualizado_en DESC);

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION actualizar_ubicacion_real_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_ubicacion_real_timestamp
  BEFORE UPDATE ON ubicacion_real
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_ubicacion_real_timestamp();

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================
ALTER TABLE ubicacion_real ENABLE ROW LEVEL SECURITY;

-- Los clientes pueden ver y actualizar la ubicación de su pedido
CREATE POLICY "Clientes pueden ver ubicación de su pedido"
  ON ubicacion_real FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.id = ubicacion_real.pedido_id
      AND p.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Clientes pueden actualizar su ubicación"
  ON ubicacion_real FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.id = ubicacion_real.pedido_id
      AND p.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Clientes pueden insertar ubicación"
  ON ubicacion_real FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.id = ubicacion_real.pedido_id
      AND p.usuario_id = auth.uid()
    )
  );

-- Los repartidores pueden ver y actualizar ubicaciones de sus pedidos
CREATE POLICY "Repartidores pueden ver ubicación de su pedido"
  ON ubicacion_real FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.id = ubicacion_real.pedido_id
      AND p.repartidor_id = auth.uid()
    )
  );

CREATE POLICY "Repartidores pueden actualizar ubicación del pedido"
  ON ubicacion_real FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.id = ubicacion_real.pedido_id
      AND p.repartidor_id = auth.uid()
    )
  );

CREATE POLICY "Repartidores pueden insertar ubicación"
  ON ubicacion_real FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.id = ubicacion_real.pedido_id
      AND p.repartidor_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCIONES PARA ACTUALIZAR UBICACIONES
-- =====================================================

-- Función para actualizar ubicación del cliente
CREATE OR REPLACE FUNCTION actualizar_ubicacion_cliente(
  p_pedido_id UUID,
  p_latitud DECIMAL(10,8),
  p_longitud DECIMAL(11,8)
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Actualizar o insertar ubicación del cliente
  INSERT INTO ubicacion_real (
    pedido_id,
    cliente_latitud,
    cliente_longitud,
    cliente_actualizado_en
  ) VALUES (
    p_pedido_id,
    p_latitud,
    p_longitud,
    NOW()
  )
  ON CONFLICT (pedido_id)
  DO UPDATE SET
    cliente_latitud = p_latitud,
    cliente_longitud = p_longitud,
    cliente_actualizado_en = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar ubicación del repartidor
CREATE OR REPLACE FUNCTION actualizar_ubicacion_repartidor_real(
  p_pedido_id UUID,
  p_latitud DECIMAL(10,8),
  p_longitud DECIMAL(11,8),
  p_velocidad DECIMAL(5,2) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Actualizar o insertar ubicación del repartidor
  INSERT INTO ubicacion_real (
    pedido_id,
    repartidor_latitud,
    repartidor_longitud,
    repartidor_velocidad,
    repartidor_actualizado_en
  ) VALUES (
    p_pedido_id,
    p_latitud,
    p_longitud,
    p_velocidad,
    NOW()
  )
  ON CONFLICT (pedido_id)
  DO UPDATE SET
    repartidor_latitud = p_latitud,
    repartidor_longitud = p_longitud,
    repartidor_velocidad = p_velocidad,
    repartidor_actualizado_en = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para inicializar ubicación del restaurante
CREATE OR REPLACE FUNCTION inicializar_ubicacion_restaurante(
  p_pedido_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_restaurante_lat DECIMAL(10,8);
  v_restaurante_lng DECIMAL(11,8);
BEGIN
  -- Obtener ubicación del restaurante del pedido
  SELECT r.latitud, r.longitud
  INTO v_restaurante_lat, v_restaurante_lng
  FROM pedidos p
  JOIN restaurantes r ON p.restaurante_id = r.id
  WHERE p.id = p_pedido_id;
  
  IF v_restaurante_lat IS NOT NULL AND v_restaurante_lng IS NOT NULL THEN
    -- Insertar o actualizar ubicación del restaurante
    INSERT INTO ubicacion_real (
      pedido_id,
      restaurante_latitud,
      restaurante_longitud
    ) VALUES (
      p_pedido_id,
      v_restaurante_lat,
      v_restaurante_lng
    )
    ON CONFLICT (pedido_id)
    DO UPDATE SET
      restaurante_latitud = v_restaurante_lat,
      restaurante_longitud = v_restaurante_lng;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER PARA INICIALIZAR UBICACIÓN AL CREAR PEDIDO
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_inicializar_ubicacion_pedido()
RETURNS TRIGGER AS $$
BEGIN
  -- Inicializar ubicación del cliente y restaurante
  INSERT INTO ubicacion_real (
    pedido_id,
    cliente_latitud,
    cliente_longitud,
    cliente_actualizado_en
  ) VALUES (
    NEW.id,
    NEW.latitud,
    NEW.longitud,
    NOW()
  );
  
  -- Inicializar ubicación del restaurante
  PERFORM inicializar_ubicacion_restaurante(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inicializar_ubicacion
  AFTER INSERT ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_inicializar_ubicacion_pedido();
