import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import MapaTracking from "../components/MapaTracking";
import "./DetallePedidoCliente.css";

interface DetallePedido {
  pedido_id: string;
  numero_pedido: string;
  total: number;
  estado: string;
  direccion_entrega: string;
  latitud: number;
  longitud: number;
  notas_cliente: string | null;
  creado_en: string;
  confirmado_en: string | null;
  asignado_en: string | null;
  entregado_en: string | null;
  restaurante_nombre: string;
  restaurante_emoji: string;
  repartidor_nombre: string | null;
  repartidor_telefono: string | null;
  repartidor_foto: string | null;
  repartidor_vehiculo: string | null;
  tiene_repartidor: boolean;
  tracking_activo: boolean;
  total_items: number;
}

interface ItemPedido {
  detalle_id: string;
  platillo_nombre: string;
  platillo_descripcion: string;
  platillo_imagen: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas_platillo: string | null;
}

export default function DetallePedidoCliente() {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState<DetallePedido | null>(null);
  const [items, setItems] = useState<ItemPedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario || !pedidoId) {
      navigate("/login");
      return;
    }

    cargarPedido();

    // Suscribirse a cambios en el pedido
    const channel = supabase
      .channel(`pedido-${pedidoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
          filter: `id=eq.${pedidoId}`,
        },
        () => {
          cargarPedido();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pedidoId, usuario]);

  const cargarPedido = async () => {
    if (!pedidoId) return;

    try {
      // Cargar información del pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from("vista_pedidos_cliente")
        .select("*")
        .eq("pedido_id", pedidoId)
        .single();

      if (pedidoError) throw pedidoError;

      // Cargar items del pedido
      const { data: itemsData, error: itemsError } = await supabase
        .from("vista_detalle_pedido_completo")
        .select("*")
        .eq("pedido_id", pedidoId);

      if (itemsError) throw itemsError;

      setPedido(pedidoData as DetallePedido);
      setItems(itemsData as ItemPedido[]);
    } catch (error) {
      console.error("Error al cargar pedido:", error);
      alert("Error al cargar el pedido");
    } finally {
      setLoading(false);
    }
  };

  const obtenerEstadoColor = (estado: string) => {
    const colores: Record<string, string> = {
      pendiente: "bg-yellow-100 text-yellow-800",
      confirmado: "bg-blue-100 text-blue-800",
      en_preparacion: "bg-purple-100 text-purple-800",
      listo: "bg-green-100 text-green-800",
      en_camino: "bg-indigo-100 text-indigo-800",
      entregado: "bg-gray-100 text-gray-800",
      cancelado: "bg-red-100 text-red-800",
    };
    return colores[estado] || "bg-gray-100 text-gray-800";
  };

  const obtenerTextoEstado = (estado: string) => {
    const textos: Record<string, string> = {
      pendiente: "⏳ Esperando confirmación",
      confirmado: "✅ Confirmado por el restaurante",
      en_preparacion: "👨‍🍳 Preparando tu pedido",
      listo: "📦 Listo para entrega",
      en_camino: "🚚 En camino a tu ubicación",
      entregado: "✅ Entregado",
      cancelado: "❌ Cancelado",
    };
    return textos[estado] || estado;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ width: 48, height: 48, borderRadius: 24, borderBottom: "4px solid #6366f1", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Pedido no encontrado</p>
        <button
          onClick={() => navigate("/pedidos")}
          className="mt-4 text-indigo-600 hover:underline"
        >
          Volver a mis pedidos
        </button>
      </div>
    );
  }

  return (
    <div className="detalle-page">
      <div className="detalle-wrapper">
        <div className="detalle-card">
          <div className="detalle-header">
            <div>
              <h1 className="detalle-title">Pedido #{pedido.numero_pedido}</h1>
              <p className="detalle-sub">{pedido.restaurante_emoji} {pedido.restaurante_nombre}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p className="total-amount">${pedido.total.toFixed(2)}</p>
              <p style={{ color: "#6b7280" }}>{pedido.total_items} items</p>
            </div>
          </div>

          <div className={`estado-badge ${
            pedido.estado === 'pendiente' ? 'estado-pendiente' :
            pedido.estado === 'confirmado' ? 'estado-confirmado' :
            pedido.estado === 'en_preparacion' ? 'estado-preparacion' :
            pedido.estado === 'listo' ? 'estado-listo' :
            pedido.estado === 'en_camino' ? 'estado-en-camino' :
            pedido.estado === 'entregado' ? 'estado-entregado' :
            pedido.estado === 'cancelado' ? 'estado-cancelado' : ''
          }`}>
            {obtenerTextoEstado(pedido.estado)}
          </div>

          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-dot">✓</div>
              <div>
                <p style={{ fontWeight: 700, margin: 0 }}>Pedido realizado</p>
                <p style={{ color: '#6b7280', margin: 0 }}>{new Date(pedido.creado_en).toLocaleString('es-MX')}</p>
              </div>
            </div>

            {pedido.confirmado_en && (
              <div className="timeline-item">
                <div className="timeline-dot">✓</div>
                <div>
                  <p style={{ fontWeight: 700, margin: 0 }}>Confirmado</p>
                  <p style={{ color: '#6b7280', margin: 0 }}>{new Date(pedido.confirmado_en).toLocaleString('es-MX')}</p>
                </div>
              </div>
            )}

            {pedido.asignado_en && (
              <div className="timeline-item">
                <div className="timeline-dot">✓</div>
                <div>
                  <p style={{ fontWeight: 700, margin: 0 }}>Repartidor asignado</p>
                  <p style={{ color: '#6b7280', margin: 0 }}>{new Date(pedido.asignado_en).toLocaleString('es-MX')}</p>
                </div>
              </div>
            )}

            {pedido.entregado_en && (
              <div className="timeline-item">
                <div className="timeline-dot">✓</div>
                <div>
                  <p style={{ fontWeight: 700, margin: 0 }}>Entregado</p>
                  <p style={{ color: '#6b7280', margin: 0 }}>{new Date(pedido.entregado_en).toLocaleString('es-MX')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {pedido.tiene_repartidor && pedido.repartidor_nombre && (
          <div className="detalle-card repartidor-card">
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>🚚 Tu Repartidor</h2>
            </div>
            <div style={{ flex: 1 }}>
              <div className="repartidor-card">
                {pedido.repartidor_foto ? (
                  <img src={pedido.repartidor_foto} alt={pedido.repartidor_nombre} className="repartidor-photo" />
                ) : (
                  <div className="repartidor-placeholder">👤</div>
                )}
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>{pedido.repartidor_nombre}</p>
                  {pedido.repartidor_vehiculo && (<p style={{ margin: 0, color: '#374151', textTransform: 'capitalize' }}>{pedido.repartidor_vehiculo}</p>)}
                  {pedido.repartidor_telefono && (<a href={`tel:${pedido.repartidor_telefono}`} style={{ color: '#4f46e5', textDecoration: 'none' }}>📞 {pedido.repartidor_telefono}</a>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {pedido.tracking_activo && (
          <div className="detalle-card map-card">
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>🗺️ Ubicación en Tiempo Real</h2>
            <MapaTracking pedidoId={pedidoId!} clienteLat={pedido.latitud} clienteLng={pedido.longitud} />
          </div>
        )}

        <div className="detalle-card">
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>📍 Dirección de Entrega</h2>
          <p style={{ margin: 0, color: '#111827' }}>{pedido.direccion_entrega}</p>
          {pedido.notas_cliente && (
            <div className="address-note">
              <p style={{ margin: 0, fontWeight: 700, color: '#92400e' }}>💬 Notas de entrega:</p>
              <p style={{ margin: 0, color: '#374151' }}>{pedido.notas_cliente}</p>
            </div>
          )}
        </div>

        <div className="detalle-card items-card">
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>📦 Items del Pedido</h2>
          <div>
            {items.map((item) => (
              <div key={item.detalle_id} className="item-row">
                {item.platillo_imagen && (
                  <img src={item.platillo_imagen} alt={item.platillo_nombre} className="item-image" />
                )}
                <div className="item-details">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontWeight: 700 }}>{item.platillo_nombre}</h3>
                    <p style={{ margin: 0, fontWeight: 800, color: '#4f46e5' }}>${item.subtotal.toFixed(2)}</p>
                  </div>
                  <p style={{ margin: '6px 0', color: '#6b7280' }}>{item.platillo_descripcion}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                    <p> Cantidad: {item.cantidad} × ${item.precio_unitario.toFixed(2)}</p>
                    {item.notas_platillo && <p style={{ fontStyle: 'italic' }}>Nota: {item.notas_platillo}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="total-row">
            <span>Total:</span>
            <span style={{ color: '#4f46e5' }}>${pedido.total.toFixed(2)}</span>
          </div>
        </div>

        <button onClick={() => navigate('/pedidos')} className="primary-btn">← Volver a Mis Pedidos</button>
      </div>
    </div>
  );
}
