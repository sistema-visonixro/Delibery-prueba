import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import MapaTracking from "../components/MapaTracking";
import InfoModal from "../components/InfoModal";
import { useInfoModal } from "../hooks/useInfoModal";
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
  const { modalState, showError, closeModal } = useInfoModal();

  const [pedido, setPedido] = useState<DetallePedido | null>(null);
  const [items, setItems] = useState<ItemPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMapModal, setShowMapModal] = useState(false);

  // Actualizar ubicación del cliente cada 20 segundos
  useEffect(() => {
    if (!pedidoId || !usuario?.id) return;

    const actualizarUbicacionCliente = async () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // Insertar o actualizar en la tabla ubicacion_real
              const { error } = await supabase.from("ubicacion_real").upsert(
                {
                  usuario_id: usuario.id,
                  latitud: position.coords.latitude,
                  longitud: position.coords.longitude,
                  velocidad: position.coords.speed,
                  precision_metros: Math.round(position.coords.accuracy),
                  heading: position.coords.heading,
                  actualizado_en: new Date().toISOString(),
                },
                {
                  onConflict: "usuario_id",
                },
              );

              if (error) {
                console.error(
                  "Error al actualizar ubicación del cliente:",
                  error,
                );
              }
            } catch (err) {
              console.error("Error actualizando ubicación:", err);
            }
          },
          (error) => {
            console.warn("No se pudo obtener la ubicación del cliente:", error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
        );
      }
    };

    // Actualizar inmediatamente
    actualizarUbicacionCliente();

    // Actualizar cada 20 segundos
    const intervalo = setInterval(actualizarUbicacionCliente, 20000);

    return () => {
      clearInterval(intervalo);
    };
  }, [pedidoId, usuario?.id]);

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
        },
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
      showError("Error al cargar el pedido");
    } finally {
      setLoading(false);
    }
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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            borderBottom: "4px solid #6366f1",
            animation: "spin 1s linear infinite",
          }}
        />
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
      {/* Back Button */}
      <button onClick={() => navigate("/pedidos")} className="back-button">
        <span className="back-arrow">←</span>
        <span>Mis Pedidos</span>
      </button>

      <div className="detalle-wrapper">
        {/* Main Order Info Card */}
        <div className="detalle-card main-card">
          <div className="order-header-section">
            <div className="restaurant-badge">
              <span className="restaurant-emoji-large">
                {pedido.restaurante_emoji}
              </span>
              <div>
                <h1 className="order-title">{pedido.restaurante_nombre}</h1>
                <p className="order-subtitle">Pedido #{pedido.numero_pedido}</p>
              </div>
            </div>
            <div className="order-amount-section">
              <p className="order-total-label">Total</p>
              <p className="order-total-value">L {pedido.total.toFixed(2)}</p>
              <p className="order-items-count">
                {pedido.total_items} item{pedido.total_items > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`modern-status-badge status-${pedido.estado}`}>
            <span className="status-pulse"></span>
            <span className="status-label">
              {obtenerTextoEstado(pedido.estado)}
            </span>
          </div>

          {/* Enhanced Timeline */}
          <div className="modern-timeline">
            <div className="timeline-line"></div>

            <div className="timeline-step completed">
              <div className="timeline-icon">
                <span>✓</span>
              </div>
              <div className="timeline-content">
                <p className="timeline-title">Pedido realizado</p>
                <p className="timeline-time">
                  {new Date(pedido.creado_en).toLocaleString("es-MX", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>

            {pedido.confirmado_en && (
              <div className="timeline-step completed">
                <div className="timeline-icon">
                  <span>✓</span>
                </div>
                <div className="timeline-content">
                  <p className="timeline-title">Confirmado por restaurante</p>
                  <p className="timeline-time">
                    {new Date(pedido.confirmado_en).toLocaleString("es-MX", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
            )}

            {pedido.asignado_en && (
              <div className="timeline-step completed">
                <div className="timeline-icon">
                  <span>🚚</span>
                </div>
                <div className="timeline-content">
                  <p className="timeline-title">Repartidor asignado</p>
                  <p className="timeline-time">
                    {new Date(pedido.asignado_en).toLocaleString("es-MX", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
            )}

            {pedido.entregado_en && (
              <div className="timeline-step completed">
                <div className="timeline-icon">
                  <span>🎉</span>
                </div>
                <div className="timeline-content">
                  <p className="timeline-title">Pedido entregado</p>
                  <p className="timeline-time">
                    {new Date(pedido.entregado_en).toLocaleString("es-MX", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Person Card */}
        {pedido.tiene_repartidor && pedido.repartidor_nombre && (
          <div className="detalle-card delivery-card">
            <div className="card-title-row">
              <h2 className="card-title">
                <span className="card-icon">🚚</span>
                Tu Repartidor
              </h2>
            </div>
            <div className="delivery-person-info">
              {pedido.repartidor_foto ? (
                <img
                  src={pedido.repartidor_foto}
                  alt={pedido.repartidor_nombre}
                  className="delivery-photo"
                />
              ) : (
                <div className="delivery-photo-placeholder">
                  <span>👤</span>
                </div>
              )}
              <div className="delivery-details">
                <p className="delivery-name">{pedido.repartidor_nombre}</p>
                {pedido.repartidor_vehiculo && (
                  <p className="delivery-vehicle">
                    🏍️ {pedido.repartidor_vehiculo}
                  </p>
                )}
                {pedido.repartidor_telefono && (
                  <a
                    href={`tel:${pedido.repartidor_telefono}`}
                    className="delivery-phone"
                  >
                    📞 {pedido.repartidor_telefono}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Map Card */}
        {pedido.tracking_activo && (
          <div className="detalle-card map-container-card">
            <div className="card-title-row">
              <h2 className="card-title">
                <span className="card-icon">🗺️</span>
                Ubicación en Tiempo Real
              </h2>
              <button
                onClick={() => setShowMapModal(true)}
                className="expand-map-btn"
              >
                <span>⛶</span> Expandir
              </button>
            </div>
            <div className="map-preview">
              <MapaTracking
                pedidoId={pedidoId!}
                clienteLat={pedido.latitud}
                clienteLng={pedido.longitud}
              />
            </div>
          </div>
        )}

        {/* Map Modal */}
        {showMapModal && (
          <div className="map-modal">
            <div className="map-modal-header">
              <h3 className="map-modal-title">
                <span>📍</span>
                Ubicación del pedido
              </h3>
              <button
                onClick={() => setShowMapModal(false)}
                className="map-modal-close"
              >
                ✕
              </button>
            </div>
            <div className="map-modal-content">
              {pedido && (
                <MapaTracking
                  pedidoId={pedidoId!}
                  clienteLat={pedido.latitud}
                  clienteLng={pedido.longitud}
                />
              )}
            </div>
          </div>
        )}

        {/* Address Card */}
        <div className="detalle-card address-card">
          <h2 className="card-title">
            <span className="card-icon">📍</span>
            Dirección de Entrega
          </h2>
          <p className="address-text">{pedido.direccion_entrega}</p>
          {pedido.notas_cliente && (
            <div className="delivery-notes">
              <p className="notes-label">💬 Notas de entrega</p>
              <p className="notes-text">{pedido.notas_cliente}</p>
            </div>
          )}
        </div>

        {/* Items Card */}
        <div className="detalle-card items-section">
          <h2 className="card-title">
            <span className="card-icon">📦</span>
            Items del Pedido
          </h2>
          <div className="items-list">
            {items.map((item, index) => (
              <div
                key={item.detalle_id}
                className={`item-card ${index !== items.length - 1 ? "with-border" : ""}`}
              >
                {item.platillo_imagen && (
                  <div className="item-image-container">
                    <img
                      src={item.platillo_imagen}
                      alt={item.platillo_nombre}
                      className="item-image-modern"
                    />
                  </div>
                )}
                <div className="item-info">
                  <div className="item-header">
                    <h3 className="item-name">{item.platillo_nombre}</h3>
                    <p className="item-price">L {item.subtotal.toFixed(2)}</p>
                  </div>
                  <p className="item-description">
                    {item.platillo_descripcion}
                  </p>
                  <div className="item-footer">
                    <p className="item-quantity">
                      Cantidad: {item.cantidad} × L{" "}
                      {item.precio_unitario.toFixed(2)}
                    </p>
                    {item.notas_platillo && (
                      <p className="item-notes">💬 {item.notas_platillo}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Section */}
          <div className="order-total-section">
            <div className="total-line">
              <span className="total-label">Total del pedido</span>
              <span className="total-value">L {pedido.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <InfoModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </div>
  );
}
