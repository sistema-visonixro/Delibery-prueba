# 📍 Instrucciones para Configurar Tabla ubicacion_real

## ⚠️ IMPORTANTE: Ejecuta este SQL primero

Antes de probar el mapa, debes ejecutar el siguiente archivo SQL en el Editor SQL de Supabase:

```
sql/08_crear_tabla_ubicacion_real.sql
```

## 🚀 Pasos para Ejecutar

1. **Abre Supabase Dashboard**
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Abre el SQL Editor**
   - Click en "SQL Editor" en el menú lateral
   - Click en "New query"

3. **Copia y Pega el Contenido**
   - Abre el archivo `sql/08_crear_tabla_ubicacion_real.sql`
   - Copia todo el contenido
   - Pégalo en el editor SQL

4. **Ejecuta el Script**
   - Click en "Run" o presiona `Ctrl + Enter`
   - Espera a que termine (debería mostrar "Success")

## ✅ Verificación

Después de ejecutar el script, verifica que todo se creó correctamente:

```sql
-- Verificar que la tabla existe
SELECT * FROM ubicacion_real LIMIT 1;

-- Verificar las funciones
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN (
  'actualizar_ubicacion_cliente',
  'actualizar_ubicacion_repartidor_real',
  'inicializar_ubicacion_restaurante'
);
```

## 📊 ¿Qué hace este script?

1. **Crea la tabla `ubicacion_real`** que almacena:
   - Ubicación del cliente (se actualiza cada 20 segundos)
   - Ubicación del repartidor (se actualiza durante la entrega)
   - Ubicación del restaurante (fija)

2. **Crea funciones SQL** para:
   - `actualizar_ubicacion_cliente()`: Actualiza la ubicación del cliente
   - `actualizar_ubicacion_repartidor_real()`: Actualiza la ubicación del repartidor
   - `inicializar_ubicacion_restaurante()`: Obtiene la ubicación del restaurante

3. **Configura políticas RLS** para:
   - Permitir que clientes vean y actualicen su ubicación
   - Permitir que repartidores vean y actualicen ubicaciones de sus pedidos

4. **Crea un trigger** que inicializa automáticamente las ubicaciones cuando se crea un pedido

## 🗺️ Cómo Funciona el Mapa

### Cliente

- Cuando abre el detalle del pedido, su ubicación se guarda automáticamente
- La ubicación se actualiza cada 20 segundos mientras la página está abierta
- Esto permite al repartidor ver dónde está el cliente en tiempo real

### Repartidor

- Cuando toma un pedido, su ubicación se actualiza durante la entrega
- El cliente puede ver el marcador del repartidor moviéndose en el mapa

### Restaurante

- El marcador del restaurante es fijo (ubicación del negocio)
- Se obtiene de la tabla `restaurantes`

## 🎨 Marcadores del Mapa

- 🔴 Rojo = Cliente (destino de entrega)
- 🔵 Azul = Repartidor (en movimiento)
- 🟢 Verde = Restaurante (origen del pedido)

## 🔧 Troubleshooting

### Error: "tabla ubicacion_real no existe"

- Ejecuta el script SQL `08_crear_tabla_ubicacion_real.sql`

### Error: "función no existe"

- Verifica que ejecutaste TODO el script, no solo partes

### El mapa aparece negro

- Verifica que las políticas RLS estén correctamente configuradas
- Asegúrate de que el pedido tenga datos en `ubicacion_real`

### No se actualiza la ubicación del cliente

- Verifica que el navegador tenga permisos de geolocalización
- Abre la consola del navegador para ver errores

## 📝 Notas Adicionales

- La ubicación del cliente requiere permisos de geolocalización en el navegador
- Si el usuario niega los permisos, se usará la ubicación del pedido original
- Las actualizaciones se detienen cuando el usuario cierra la página
