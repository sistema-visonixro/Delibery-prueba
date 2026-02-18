import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import InfoModal from "../components/InfoModal";
import { useInfoModal } from "../hooks/useInfoModal";
import ConfirmModal from "../components/ConfirmModal";
import "./Carrito.css";

interface ItemCarrito {
  id: string;
  platillo_id: string;
  cantidad: number;
  precio_unitario: number;
  notas: string | null;
  platillo_nombre: string;
  platillo_descripcion: string;
  platillo_imagen: string;
  restaurante_nombre: string;
  restaurante_emoji: string;
  restaurante_activo: boolean;
  platillo_disponible: boolean;
  tiempo_entrega_min: number;
  costo_envio: number;
  subtotal: number;
}

interface ResumenCarrito {
  restaurante_nombre: string;
  restaurante_emoji: string;
  total_items: number;
  cantidad_total: number;
  subtotal_productos: number;
  costo_envio: number;
  total_carrito: number;
  un_solo_restaurante: boolean;
  tiempo_entrega_estimado: number;
}

export default function Carrito() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [resumen, setResumen] = useState<ResumenCarrito | null>(null);
  const [loading, setLoading] = useState(true);
  const [creandoPedido, setCreandoPedido] = useState(false);
  const { modalState, showWarning, showSuccess, showError, closeModal } =
    useInfoModal();
  const [showConfirmVaciar, setShowConfirmVaciar] = useState(false);

  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [metodoPago, setMetodoPago] = useState<
    "tarjeta" | "transferencia" | "efectivo"
  >("efectivo");

  useEffect(() => {
    cargarCarrito();
  }, []);

  const cargarCarrito = async () => {
    if (!usuario?.id) return;

    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from("vista_carrito")
        .select("*")
        .eq("usuario_id", usuario.id);

      if (itemsError) throw itemsError;

      const { data: resumenData, error: resumenError } = await supabase
        .from("vista_resumen_carrito")
        .select("*")
        .eq("usuario_id", usuario.id)
        .single();

      if (resumenError && resumenError.code !== "PGRST116") throw resumenError;

      setItems(itemsData || []);
      setResumen(resumenData);
    } catch (error) {
      console.error("Error al cargar carrito:", error);
    } finally {
      setLoading(false);
    }
  };

  const actualizarCantidad = async (itemId: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;

    try {
      const { error } = await supabase
        .from("carrito")
        .update({ cantidad: nuevaCantidad })
        .eq("id", itemId);

      if (error) throw error;
      await cargarCarrito();
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
    }
  };

  const eliminarItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("carrito")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      await cargarCarrito();
    } catch (error) {
      console.error("Error al eliminar item:", error);
    }
  };

  const vaciarCarrito = async () => {
    if (!usuario?.id) return;
    setShowConfirmVaciar(true);
  };

  const confirmarVaciarCarrito = async () => {
    if (!usuario?.id) return;
    setShowConfirmVaciar(false);

    try {
      const { error } = await supabase.rpc("limpiar_carrito_usuario", {
        p_usuario_id: usuario.id,
      });

      if (error) throw error;
      await cargarCarrito();
    } catch (error) {
      console.error("Error al vaciar carrito:", error);
    }
  };

  const crearPedido = async () => {
    if (!usuario?.id || !direccion.trim()) {
      showWarning("Por favor ingresa la dirección de entrega");
      return;
    }

    if (!metodoPago) {
      showWarning("Por favor selecciona un método de pago");
      return;
    }

    setCreandoPedido(true);
    try {
      const metodoPagoTexto =
        metodoPago === "tarjeta"
          ? "Tarjeta"
          : metodoPago === "transferencia"
            ? "Transferencia"
            : "Efectivo";

      // Calcular total a partir de los items y costo de envío
      const productosTotal = items.reduce((s, it) => s + (it.subtotal || 0), 0);
      const total = (resumen?.costo_envio || 0) + productosTotal;

      // Obtener restaurante_id desde la tabla carrito (por seguridad)
      const { data: restos, error: restosError } = await supabase
        .from("carrito")
        .select("restaurante_id")
        .eq("usuario_id", usuario.id)
        .limit(1);

      if (restosError) throw restosError;
      const restaurante_id =
        restos && restos.length > 0 ? restos[0].restaurante_id : null;

      // Generar número de pedido simple (puede colisionar, pero es funcional)
      const ahora = new Date();
      const fecha = ahora.toISOString().slice(0, 10).replace(/-/g, "");
      const random4 = String(Math.floor(Math.random() * 10000)).padStart(
        4,
        "0",
      );
      const numero_pedido = `PED-${fecha}-${random4}`;

      // Insertar pedido incluyendo tipo_pago
      const { data: pedidoData, error: pedidoError } = await supabase
        .from("pedidos")
        .insert([
          {
            usuario_id: usuario.id,
            restaurante_id: restaurante_id,
            numero_pedido,
            total,
            estado: "pendiente",
            direccion_entrega: direccion,
            latitud: 19.4326,
            longitud: -99.1332,
            notas_cliente: notas || null,
            tipo_pago: metodoPagoTexto,
          },
        ])
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      const pedido_id = pedidoData.id;

      // Insertar detalle_pedidos
      const detalle = items.map((it) => ({
        pedido_id,
        platillo_id: it.platillo_id,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        subtotal: it.subtotal,
        notas: it.notas,
      }));

      if (detalle.length > 0) {
        const { error: detalleError } = await supabase
          .from("detalle_pedidos")
          .insert(detalle);

        if (detalleError) {
          // intentar revertir pedido
          await supabase.from("pedidos").delete().eq("id", pedido_id);
          throw detalleError;
        }
      }

      // Limpiar carrito del usuario
      const { error: limpiarError } = await supabase
        .from("carrito")
        .delete()
        .eq("usuario_id", usuario.id);

      if (limpiarError) {
        console.warn(
          "No se pudo limpiar el carrito automáticamente:",
          limpiarError,
        );
      }

      showSuccess(
        `¡Pedido creado exitosamente! 🎉\nMétodo de pago: ${metodoPagoTexto}`,
      );
      setTimeout(() => navigate("/pedidos"), 1500);
    } catch (error: any) {
      console.error("Error al crear pedido:", error);
      showError(error.message || "Error al crear el pedido");
    } finally {
      setCreandoPedido(false);
    }
  };

  if (loading) {
    return (
      <div className="cart-page">
        <Header />
        <div className="cart-loading">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="loading-icon"
          >
            🛒
          </motion.div>
          <p className="loading-text">Cargando tu carrito...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <Header />
        <div className="cart-empty">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="empty-content"
          >
            <div className="empty-icon">🛒</div>
            <h2 className="empty-title">Tu carrito está vacío</h2>
            <p className="empty-description">
              ¡Agrega deliciosos platillos y comienza tu pedido!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/home")}
              className="empty-button"
            >
              <span className="button-icon">🍽️</span>
              Explorar Restaurantes
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Header />

      <div className="cart-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cart-header"
        >
          <div className="header-left">
            <h1 className="cart-title">
              <span className="title-icon">🛒</span>
              Mi Carrito
            </h1>
            <p className="cart-subtitle">
              {resumen?.total_items}{" "}
              {resumen?.total_items === 1 ? "producto" : "productos"}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={vaciarCarrito}
            className="clear-cart-btn"
          >
            <span>🗑️</span>
            Vaciar
          </motion.button>
        </motion.div>

        <div className="cart-grid">
          {/* Items Column */}
          <div className="items-column">
            {/* Restaurant Banner */}
            {resumen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="restaurant-banner"
              >
                <div className="banner-emoji">{resumen.restaurante_emoji}</div>
                <div className="banner-info">
                  <h3 className="banner-name">{resumen.restaurante_nombre}</h3>
                  <p className="banner-meta">
                    <span>⏱️ {resumen.tiempo_entrega_estimado} min</span>
                    <span>•</span>
                    <span>🚚 L {resumen.costo_envio.toFixed(2)}</span>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Items List */}
            <div className="items-list">
              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className="cart-item"
                  >
                    {item.platillo_imagen && (
                      <div className="item-image-wrapper">
                        <img
                          src={item.platillo_imagen}
                          alt={item.platillo_nombre}
                          className="item-image"
                        />
                        {!item.platillo_disponible && (
                          <div className="unavailable-badge">No disponible</div>
                        )}
                      </div>
                    )}

                    <div className="item-details">
                      <h4 className="item-name">{item.platillo_nombre}</h4>
                      <p className="item-description">
                        {item.platillo_descripcion}
                      </p>
                      <p className="item-price">
                        L {item.precio_unitario.toFixed(2)}
                      </p>

                      {item.notas && (
                        <div className="item-notes">
                          <span>📝</span>
                          {item.notas}
                        </div>
                      )}

                      <div className="item-actions">
                        <div className="quantity-controls">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              actualizarCantidad(item.id, item.cantidad - 1)
                            }
                            disabled={item.cantidad <= 1}
                            className="qty-btn"
                          >
                            −
                          </motion.button>
                          <span className="qty-value">{item.cantidad}</span>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              actualizarCantidad(item.id, item.cantidad + 1)
                            }
                            className="qty-btn"
                          >
                            +
                          </motion.button>
                        </div>

                        <div className="item-footer">
                          <span className="item-subtotal">
                            L {item.subtotal.toFixed(2)}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => eliminarItem(item.id)}
                            className="delete-btn"
                          >
                            🗑️
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Checkout Column */}
          <div className="checkout-column">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="checkout-card"
            >
              {/* Delivery Info */}
              <div className="checkout-section">
                <h3 className="section-title">
                  <span>📍</span>
                  Datos de Entrega
                </h3>

                <div className="form-group">
                  <label className="form-label">Dirección de entrega *</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Calle, número, colonia..."
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notas adicionales</label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Indicaciones, referencias..."
                    rows={3}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="section-divider" />

              {/* Payment Methods */}
              <div className="checkout-section">
                <h3 className="section-title">
                  <span>💳</span>
                  Método de Pago
                </h3>

                <div className="payment-options">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMetodoPago("tarjeta")}
                    className={`payment-option ${metodoPago === "tarjeta" ? "active" : ""}`}
                  >
                    <div className="payment-icon">💳</div>
                    <div className="payment-text">
                      <div className="payment-name">Tarjeta</div>
                      <div className="payment-desc">Débito o Crédito</div>
                    </div>
                    {metodoPago === "tarjeta" && (
                      <div className="payment-check">✓</div>
                    )}
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMetodoPago("transferencia")}
                    className={`payment-option ${metodoPago === "transferencia" ? "active" : ""}`}
                  >
                    <div className="payment-icon">🏦</div>
                    <div className="payment-text">
                      <div className="payment-name">Transferencia</div>
                      <div className="payment-desc">Bancaria</div>
                    </div>
                    {metodoPago === "transferencia" && (
                      <div className="payment-check">✓</div>
                    )}
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMetodoPago("efectivo")}
                    className={`payment-option ${metodoPago === "efectivo" ? "active" : ""}`}
                  >
                    <div className="payment-icon">💵</div>
                    <div className="payment-text">
                      <div className="payment-name">Efectivo</div>
                      <div className="payment-desc">Pago al recibir</div>
                    </div>
                    {metodoPago === "efectivo" && (
                      <div className="payment-check">✓</div>
                    )}
                  </motion.div>
                </div>
              </div>

              <div className="section-divider" />

              {/* Summary */}
              <div className="checkout-section">
                <h3 className="section-title">Resumen del Pedido</h3>

                <div className="summary-row">
                  <span className="summary-label">
                    Subtotal ({resumen?.total_items} productos)
                  </span>
                  <span className="summary-value">
                    L {resumen?.subtotal_productos.toFixed(2)}
                  </span>
                </div>

                <div className="summary-row">
                  <span className="summary-label">Costo de envío</span>
                  <span className="summary-value">
                    L {resumen?.costo_envio.toFixed(2)}
                  </span>
                </div>

                <div className="section-divider" />

                <div className="total-row">
                  <span className="total-label">Total</span>
                  <span className="total-value">
                    L {resumen?.total_carrito.toFixed(2)}
                  </span>
                </div>

                
                
                
              </div>

              {/* Checkout Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={crearPedido}
                disabled={creandoPedido || !direccion.trim()}
                className={`checkout-btn ${creandoPedido || !direccion.trim() ? "disabled" : ""}`}
              >
                {creandoPedido ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="btn-icon"
                    >
                      ⏳
                    </motion.span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🚀</span>
                    Realizar Pedido
                  </>
                )}
              </motion.button>
            </motion.div>
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

      <ConfirmModal
        visible={showConfirmVaciar}
        title="Vaciar Carrito"
        description="¿Seguro que quieres vaciar el carrito? Esta acción no se puede deshacer."
        onCancel={() => setShowConfirmVaciar(false)}
        onConfirm={confirmarVaciarCarrito}
        confirmLabel="Sí, vaciar"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
