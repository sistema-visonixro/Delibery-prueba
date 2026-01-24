import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import InfoModal from "../components/InfoModal";
import { useInfoModal } from "../hooks/useInfoModal";
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
  const { modalState, showWarning, showSuccess, showError, closeModal } = useInfoModal();

  // Formulario de pedido
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    cargarCarrito();
  }, []);

  const cargarCarrito = async () => {
    if (!usuario?.id) return;

    try {
      // Cargar items del carrito
      const { data: itemsData, error: itemsError } = await supabase
        .from("vista_carrito")
        .select("*")
        .eq("usuario_id", usuario.id);

      if (itemsError) throw itemsError;

      // Cargar resumen
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

    const confirmar = window.confirm("¿Seguro que quieres vaciar el carrito?");
    if (!confirmar) return;

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

    setCreandoPedido(true);
    try {
      // Obtener coordenadas (por ahora usamos coordenadas dummy, puedes integrar geolocalización)
      const { error } = await supabase.rpc("crear_pedido_desde_carrito", {
        p_usuario_id: usuario.id,
        p_direccion_entrega: direccion,
        p_latitud: 19.4326, // Coordenadas de ejemplo
        p_longitud: -99.1332,
        p_notas_cliente: notas || null,
      });

      if (error) throw error;

      showSuccess("¡Pedido creado exitosamente! 🎉");
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
      <div style={styles.container}>
        <Header />
        <div style={styles.loadingContainer}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={styles.spinner}
          >
            🛒
          </motion.div>
          <p style={styles.loadingText}>Cargando tu carrito...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={styles.container}>
        <Header />
        <div style={styles.content}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.emptyState}
          >
            <div style={styles.emptyIcon}>🛒</div>
            <h2 style={styles.emptyTitle}>Tu carrito está vacío</h2>
            <p style={styles.emptyText}>
              ¡Agrega deliciosos platillos y comienza tu pedido!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/home")}
              style={styles.exploreButton}
            >
              <span style={{ marginRight: "8px" }}>🍽️</span>
              Explorar Restaurantes
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header />
      <div style={styles.content} className="carrito-content">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.header}
          className="carrito-header"
        >
          <h1 style={styles.title} className="carrito-title">
            <span style={{ fontSize: "32px", marginRight: "12px" }}>🛒</span>
            Mi Carrito
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={vaciarCarrito}
            style={styles.clearButton}
            className="carrito-clear-button"
          >
            🗑️ Vaciar
          </motion.button>
        </motion.div>

        <div style={styles.mainGrid} className="carrito-main-grid">
          {/* Columna de items */}
          <div style={styles.itemsColumn}>
            {/* Información del restaurante */}
            {resumen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={styles.restaurantBanner}
                className="carrito-restaurant-banner"
              >
                <div style={styles.restaurantInfo}>
                  <span
                    style={styles.restaurantEmoji}
                    className="carrito-restaurant-emoji"
                  >
                    {resumen.restaurante_emoji}
                  </span>
                  <div>
                    <h2
                      style={styles.restaurantName}
                      className="carrito-restaurant-name"
                    >
                      {resumen.restaurante_nombre}
                    </h2>
                    <p style={styles.restaurantStats}>
                      ⏱️ {resumen.tiempo_entrega_estimado} min · 🚚 L
                      {resumen.costo_envio.toFixed(2)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Items del carrito */}
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  style={styles.itemCard}
                  className="carrito-item-card"
                >
                  <div
                    style={styles.itemContent}
                    className="carrito-item-content"
                  >
                    {item.platillo_imagen && (
                      <div style={styles.imageContainer}>
                        <img
                          src={item.platillo_imagen}
                          alt={item.platillo_nombre}
                          style={styles.itemImage}
                          className="carrito-item-image"
                        />
                        {!item.platillo_disponible && (
                          <div style={styles.unavailableBadge}>
                            No disponible
                          </div>
                        )}
                      </div>
                    )}

                    <div style={styles.itemDetails}>
                      <h3 style={styles.itemName} className="carrito-item-name">
                        {item.platillo_nombre}
                      </h3>
                      <p style={styles.itemDescription}>
                        {item.platillo_descripcion}
                      </p>
                      <p style={styles.itemPrice}>
                        L {item.precio_unitario.toFixed(2)}
                      </p>

                      {item.notas && (
                        <div style={styles.notesBox}>
                          <span style={{ marginRight: "4px" }}>📝</span>
                          {item.notas}
                        </div>
                      )}

                      <div
                        style={styles.itemActions}
                        className="carrito-item-actions"
                      >
                        <div
                          style={styles.quantityControl}
                          className="carrito-quantity-control"
                        >
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              actualizarCantidad(item.id, item.cantidad - 1)
                            }
                            disabled={item.cantidad <= 1}
                            style={{
                              ...styles.quantityButton,
                              ...(item.cantidad <= 1 &&
                                styles.quantityButtonDisabled),
                            }}
                          >
                            −
                          </motion.button>
                          <span style={styles.quantity}>{item.cantidad}</span>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              actualizarCantidad(item.id, item.cantidad + 1)
                            }
                            style={styles.quantityButton}
                          >
                            +
                          </motion.button>
                        </div>

                        <div
                          style={styles.itemFooter}
                          className="carrito-item-footer"
                        >
                          <span style={styles.subtotal}>
                            L{item.subtotal.toFixed(2)}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => eliminarItem(item.id)}
                            style={styles.deleteButton}
                          >
                            🗑️
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Columna de resumen y checkout */}
          <div style={styles.summaryColumn} className="carrito-summary-column">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={styles.summaryCard}
              className="carrito-summary-card"
            >
              <h2 style={styles.summaryTitle}>📍 Datos de Entrega</h2>

              <div style={styles.formGroup}>
                <label style={styles.label}>Dirección de entrega *</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle, número, colonia..."
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notas adicionales (opcional)</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Indicaciones, referencias, etc."
                  rows={3}
                  style={{ ...styles.input, ...styles.textarea }}
                />
              </div>

              <div style={styles.divider} />

              <div style={styles.summarySection}>
                <h3 style={styles.summarySubtitle}>Resumen del Pedido</h3>

                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>
                    Subtotal ({resumen?.total_items} productos)
                  </span>
                  <span style={styles.summaryValue}>
                    L {resumen?.subtotal_productos.toFixed(2)}
                  </span>
                </div>

                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Costo de envío</span>
                  <span style={styles.summaryValue}>
                    L {resumen?.costo_envio.toFixed(2)}
                  </span>
                </div>

                <div style={styles.divider} />

                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Total</span>
                  <span
                    style={styles.totalValue}
                    className="carrito-total-value"
                  >
                    L {resumen?.total_carrito.toFixed(2)}
                  </span>
                </div>

                {resumen && (
                  <div style={styles.estimatedTime}>
                    ⏱️ Tiempo estimado: {resumen.tiempo_entrega_estimado} min
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={crearPedido}
                disabled={creandoPedido || !direccion.trim()}
                style={{
                  ...styles.checkoutButton,
                  ...(creandoPedido || !direccion.trim()
                    ? styles.checkoutButtonDisabled
                    : {}),
                }}
                className="carrito-checkout-button"
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
                      style={{ display: "inline-block", marginRight: "8px" }}
                    >
                      ⏳
                    </motion.span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <span style={{ marginRight: "8px" }}>🚀</span>
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
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #f9fafb, #ffffff)",
  },
  content: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "24px",
    paddingBottom: "100px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "16px",
  },
  spinner: {
    fontSize: "48px",
  },
  loadingText: {
    fontSize: "16px",
    color: "#6b7280",
    fontWeight: 500,
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    maxWidth: "500px",
    margin: "40px auto",
  },
  emptyIcon: {
    fontSize: "80px",
    marginBottom: "24px",
  },
  emptyTitle: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#111827",
    marginBottom: "12px",
  },
  emptyText: {
    fontSize: "16px",
    color: "#6b7280",
    marginBottom: "32px",
    lineHeight: "1.6",
  },
  exploreButton: {
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#ffffff",
    padding: "14px 32px",
    borderRadius: "12px",
    border: "none",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(79, 70, 229, 0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 800,
    color: "#111827",
    display: "flex",
    alignItems: "center",
  },
  clearButton: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 400px",
    gap: "24px",
    alignItems: "start",
  },
  itemsColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  restaurantBanner: {
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    borderRadius: "16px",
    padding: "20px",
    color: "#ffffff",
    boxShadow: "0 8px 24px rgba(79, 70, 229, 0.25)",
  },
  restaurantInfo: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  restaurantEmoji: {
    fontSize: "48px",
  },
  restaurantName: {
    fontSize: "20px",
    fontWeight: 700,
    margin: "0 0 8px 0",
  },
  restaurantStats: {
    fontSize: "14px",
    opacity: 0.95,
    margin: 0,
  },
  itemCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    transition: "all 0.3s ease",
  },
  itemContent: {
    display: "flex",
    gap: "16px",
  },
  imageContainer: {
    position: "relative",
    flexShrink: 0,
  },
  itemImage: {
    width: "120px",
    height: "120px",
    borderRadius: "12px",
    objectFit: "cover",
  },
  unavailableBadge: {
    position: "absolute",
    top: "8px",
    left: "8px",
    background: "rgba(220, 38, 38, 0.95)",
    color: "#ffffff",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 600,
  },
  itemDetails: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  itemName: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 8px 0",
  },
  itemDescription: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "0 0 8px 0",
    lineHeight: "1.5",
  },
  itemPrice: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#4f46e5",
    margin: "0 0 12px 0",
  },
  notesBox: {
    background: "#fef3c7",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#92400e",
    marginBottom: "12px",
  },
  itemActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  quantityControl: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#f3f4f6",
    borderRadius: "10px",
    padding: "4px",
  },
  quantityButton: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    border: "none",
    background: "#ffffff",
    color: "#4f46e5",
    fontSize: "18px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  quantity: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#111827",
    minWidth: "24px",
    textAlign: "center",
  },
  itemFooter: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  subtotal: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#4f46e5",
  },
  deleteButton: {
    background: "transparent",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px",
  },
  summaryColumn: {
    position: "sticky",
    top: "90px",
  },
  summaryCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  summaryTitle: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#111827",
    marginBottom: "20px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
  },
  textarea: {
    resize: "vertical",
    fontFamily: "inherit",
  },
  divider: {
    height: "1px",
    background: "#e5e7eb",
    margin: "24px 0",
  },
  summarySection: {
    marginBottom: "24px",
  },
  summarySubtitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#111827",
    marginBottom: "16px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  summaryLabel: {
    fontSize: "14px",
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#111827",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "16px",
  },
  totalLabel: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#111827",
  },
  totalValue: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#4f46e5",
  },
  estimatedTime: {
    marginTop: "12px",
    padding: "12px",
    background: "#f0fdf4",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#166534",
    textAlign: "center",
    fontWeight: 600,
  },
  checkoutButton: {
    width: "100%",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#ffffff",
    padding: "16px",
    borderRadius: "12px",
    border: "none",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(79, 70, 229, 0.3)",
    marginBottom: "12px",
  },
  checkoutButtonDisabled: {
    background: "#9ca3af",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  secureText: {
    fontSize: "13px",
    color: "#6b7280",
    textAlign: "center",
    margin: 0,
  },
};

// Media queries con CSS-in-JS
if (typeof window !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @media (max-width: 1024px) {
      /* Ajustar grid a una columna en tablets */
    }
    @media (max-width: 768px) {
      /* Ajustar para móviles */
    }
  `;
  document.head.appendChild(styleSheet);
}
