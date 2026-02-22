// =====================================================
// SERVICIOS PARA REPARTIDORES
// =====================================================

import { supabase } from "../lib/supabase";
import type {
  Repartidor,
  PedidoRepartidor,
  PedidoDisponible,
} from "../types/repartidor.types";

// =====================================================
// Gestión del Perfil de Repartidor
// =====================================================

export async function obtenerPerfilRepartidor(usuarioId: string) {
  const { data, error } = await supabase
    .from("repartidores")
    .select("*")
    .eq("usuario_id", usuarioId)
    .single();

  if (error) throw error;
  return data as Repartidor;
}

export async function actualizarPerfilRepartidor(
  repartidorId: string,
  datos: Partial<Repartidor>
) {
  const { data, error } = await supabase
    .from("repartidores")
    .update(datos)
    .eq("id", repartidorId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cambiarDisponibilidad(
  usuarioId: string,
  disponible: boolean
) {
  const { data, error } = await supabase.rpc(
    "cambiar_disponibilidad_repartidor",
    {
      p_usuario_id: usuarioId,
      p_disponible: disponible,
    }
  );

  if (error) throw error;
  return data;
}

// =====================================================
// Gestión de Pedidos
// =====================================================

export async function obtenerPedidosDisponibles() {
  const { data, error } = await supabase
    .from("vista_pedidos_disponibles_repartidores")
    .select("*")
    .order("creado_en", { ascending: true });

  if (error) throw error;
  return data as PedidoDisponible[];
}

export async function obtenerMisPedidos(usuarioId: string) {
  const { data, error } = await supabase
    .from("vista_pedidos_repartidor")
    .select("*")
    .eq("repartidor_id", usuarioId)
    .order("asignado_en", { ascending: true });

  if (error) throw error;
  return data as PedidoRepartidor[];
}

export async function tomarPedido(pedidoId: string, repartidorId: string) {
  const { data, error } = await supabase.rpc("asignar_repartidor_pedido", {
    p_pedido_id: pedidoId,
    p_repartidor_id: repartidorId,
  });

  if (error) throw error;
  return data;
}

export async function marcarPedidoEntregado(
  pedidoId: string,
  repartidorId: string
) {
  const { data, error } = await supabase.rpc("marcar_pedido_entregado", {
    p_pedido_id: pedidoId,
    p_repartidor_id: repartidorId,
  });

  if (error) throw error;
  return data;
}

// =====================================================
// Tracking de Ubicación
// =====================================================

export async function actualizarUbicacion(
  repartidorId: string,
  latitud: number,
  longitud: number,
  pedidoId?: string,
  velocidad?: number,
  precision?: number
) {
  const { data, error } = await supabase.rpc(
    "actualizar_ubicacion_repartidor",
    {
      p_repartidor_id: repartidorId,
      p_latitud: latitud,
      p_longitud: longitud,
      p_pedido_id: pedidoId || null,
      p_velocidad: velocidad ? Math.round(velocidad * 100) / 100 : null, // Redondear a 2 decimales
      p_precision: precision ? Math.round(precision) : null, // Convertir a entero
    }
  );

  if (error) throw error;
  return data;
}

export async function obtenerUbicacionPedido(pedidoId: string) {
  const { data, error } = await supabase
    .from("vista_ubicacion_actual_pedido")
    .select("*")
    .eq("pedido_id", pedidoId)
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// Hook para Tracking GPS Automático
// =====================================================

export function iniciarTrackingGPS(
  repartidorId: string,
  pedidoId: string,
  intervaloSegundos: number = 60
): () => void {
  let watchId: number | null = null;
  let intervalId: number | null = null;

  // Usar watchPosition para actualizaciones automáticas del GPS
  if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await actualizarUbicacion(
            repartidorId,
            position.coords.latitude,
            position.coords.longitude,
            pedidoId,
            position.coords.speed || undefined,
            position.coords.accuracy
          );
          console.log("Ubicación actualizada:", position.coords);
        } catch (error) {
          console.error("Error al actualizar ubicación:", error);
        }
      },
      (error) => {
        console.error("Error al obtener ubicación:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    // También enviar actualizaciones cada X segundos
    intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          await actualizarUbicacion(
            repartidorId,
            position.coords.latitude,
            position.coords.longitude,
            pedidoId,
            position.coords.speed || undefined,
            position.coords.accuracy
          );
        } catch (error) {
          console.error("Error en actualización periódica:", error);
        }
      });
    }, intervaloSegundos * 1000);
  }

  // Retornar función para detener el tracking
  return () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
  };
}

// =====================================================
// Estadísticas
// =====================================================

export async function obtenerEstadisticasRepartidor(usuarioId: string) {
  const { data, error } = await supabase
    .from("vista_estadisticas_repartidor")
    .select("*")
    .eq("usuario_id", usuarioId)
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// Notificaciones
// =====================================================

export async function obtenerNotificaciones(usuarioId: string) {
  const { data, error } = await supabase
    .from("notificaciones")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("creado_en", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}

export async function marcarNotificacionesLeidas(usuarioId: string) {
  const { data, error } = await supabase.rpc("marcar_notificaciones_leidas", {
    p_usuario_id: usuarioId,
  });

  if (error) throw error;
  return data;
}

// =====================================================
// Suscripciones en Tiempo Real
// =====================================================

export function suscribirseAPedidosDisponibles(
  callback: (pedidos: PedidoDisponible[]) => void
) {
  const channel = supabase
    .channel("pedidos-disponibles")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "pedidos",
        filter: "estado=in.(listo,confirmado)",
      },
      async () => {
        const pedidos = await obtenerPedidosDisponibles();
        callback(pedidos);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function suscribirseAMisPedidos(
  usuarioId: string,
  callback: (pedidos: PedidoRepartidor[]) => void
) {
  const channel = supabase
    .channel("mis-pedidos-repartidor")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "pedidos",
        filter: `repartidor_id=eq.${usuarioId}`,
      },
      async () => {
        const pedidos = await obtenerMisPedidos(usuarioId);
        callback(pedidos);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
