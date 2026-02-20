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

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const calcularDistanciaKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const radioTierraKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radioTierraKm * c;
};

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

interface CuentaBancaria {
  id: string;
  nombre_titular: string;
  banco: string;
  cuenta: string;
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
  const [costoEnvioCalculado, setCostoEnvioCalculado] = useState(0);
  const [distanciaActualKm, setDistanciaActualKm] = useState<number | null>(
    null,
  );

  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [metodoPago, setMetodoPago] = useState<
    "tarjeta" | "transferencia" | "efectivo"
  >("efectivo");
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>(
    [],
  );
  const [cargandoCuentas, setCargandoCuentas] = useState(false);
  const [telefonoWhatsAppComprobantes, setTelefonoWhatsAppComprobantes] =
    useState("");

  const tarjetaHabilitada = false;

  useEffect(() => {
    cargarCarrito();
  }, []);

  useEffect(() => {
    cargarCuentasBancarias();
    cargarTelefonoWhatsApp();
  }, []);

  const cargarCuentasBancarias = async () => {
    setCargandoCuentas(true);
    try {
      const { data, error } = await supabase
        .from("cuentas_bancarias")
        .select("id, nombre_titular, banco, cuenta")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCuentasBancarias((data as CuentaBancaria[]) || []);
    } catch (error) {
      console.error("Error al cargar cuentas bancarias:", error);
      setCuentasBancarias([]);
    } finally {
      setCargandoCuentas(false);
    }
  };

  const cargarTelefonoWhatsApp = async () => {
    try {
      const { data, error } = await supabase
        .from("tel")
        .select("id, numero")
        .eq("id", 1)
        .maybeSingle();

      if (error) throw error;
      setTelefonoWhatsAppComprobantes(String(data?.numero || ""));
    } catch (error) {
      console.error("Error al cargar teléfono de comprobantes:", error);
      setTelefonoWhatsAppComprobantes("");
    }
  };

  const construirEnlaceWhatsApp = () => {
    const telefonoLimpio = telefonoWhatsAppComprobantes.replace(/\D/g, "");
    if (!telefonoLimpio) return null;

    const telefonoConCodigo =
      telefonoLimpio.length === 8 ? `504${telefonoLimpio}` : telefonoLimpio;

    const mensaje = encodeURIComponent(
      "Hola, adjunto mi comprobante de transferencia para mi pedido.",
    );
    return `https://wa.me/${telefonoConCodigo}?text=${mensaje}`;
  };

  const telefonoWhatsAppMostrado = () => {
    const telefonoLimpio = telefonoWhatsAppComprobantes.replace(/\D/g, "");
    if (!telefonoLimpio) return "Número no configurado";
    return telefonoLimpio.length === 8
      ? `+504 ${telefonoLimpio}`
      : `+${telefonoLimpio}`;
  };

  const obtenerUbicacionUsuario = () =>
    new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalización no disponible"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      );
    });

  const calcularCostoEnvioDinamico = async (costoBaseVista: number) => {
    if (!usuario?.id) {
      setCostoEnvioCalculado(costoBaseVista);
      setDistanciaActualKm(null);
      return;
    }

    try {
      const ubicacionUsuario = await obtenerUbicacionUsuario();

      const { data: restoCarrito, error: restoCarritoError } = await supabase
        .from("carrito")
        .select("restaurante_id")
        .eq("usuario_id", usuario.id)
        .limit(1)
        .single();

      if (restoCarritoError || !restoCarrito?.restaurante_id) {
        setCostoEnvioCalculado(costoBaseVista);
        setDistanciaActualKm(null);
        return;
      }

      const { data: restauranteData, error: restauranteError } = await supabase
        .from("restaurantes")
        .select("*")
        .eq("id", restoCarrito.restaurante_id)
        .single();

      if (restauranteError || !restauranteData) {
        setCostoEnvioCalculado(costoBaseVista);
        setDistanciaActualKm(null);
        return;
      }

      const costoBase =
        toNumberOrNull((restauranteData as any).costo_envio) ?? costoBaseVista;
      const precioExtraPorKm =
        toNumberOrNull((restauranteData as any).precio_extra_por_km) ?? 0;
      const distanciaMinimaKm =
        toNumberOrNull((restauranteData as any).distancia_minima_km) ?? 0;
      const latitudRestaurante = toNumberOrNull(
        (restauranteData as any).latitud,
      );
      const longitudRestaurante = toNumberOrNull(
        (restauranteData as any).longitud,
      );

      if (
        precioExtraPorKm <= 0 ||
        latitudRestaurante === null ||
        longitudRestaurante === null
      ) {
        setCostoEnvioCalculado(costoBase);
        if (latitudRestaurante !== null && longitudRestaurante !== null) {
          const distanciaKm = calcularDistanciaKm(
            ubicacionUsuario.latitude,
            ubicacionUsuario.longitude,
            latitudRestaurante,
            longitudRestaurante,
          );
          setDistanciaActualKm(Number(distanciaKm.toFixed(2)));
        } else {
          setDistanciaActualKm(null);
        }
        return;
      }

      const distanciaKm = calcularDistanciaKm(
        ubicacionUsuario.latitude,
        ubicacionUsuario.longitude,
        latitudRestaurante,
        longitudRestaurante,
      );
      setDistanciaActualKm(Number(distanciaKm.toFixed(2)));

      const distanciaExtraKm = Math.max(0, distanciaKm - distanciaMinimaKm);
      const costoFinal = costoBase + distanciaExtraKm * precioExtraPorKm;
      setCostoEnvioCalculado(Number(costoFinal.toFixed(2)));
    } catch {
      setCostoEnvioCalculado(costoBaseVista);
      setDistanciaActualKm(null);
    }
  };

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
      await calcularCostoEnvioDinamico(resumenData?.costo_envio || 0);
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

    if (metodoPago === "tarjeta") {
      showWarning("Pago con tarjeta estará disponible muy pronto");
      return;
    }

    setCreandoPedido(true);
    try {
      const metodoPagoTexto =
        metodoPago === "transferencia" ? "Transferencia" : "Efectivo";

      // Calcular total a partir de los items y costo de envío
      const productosTotal = items.reduce((s, it) => s + (it.subtotal || 0), 0);
      const total = costoEnvioCalculado + productosTotal;

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
            costo_envio: costoEnvioCalculado,
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

  const subtotalProductos = resumen?.subtotal_productos ?? 0;
  const totalCarrito = subtotalProductos + costoEnvioCalculado;
  const enlaceWhatsApp = construirEnlaceWhatsApp();

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
                    {distanciaActualKm !== null && (
                      <>
                        <span>📍 {distanciaActualKm.toFixed(2)} km</span>
                        <span>•</span>
                      </>
                    )}
                    <span>🚚 L {costoEnvioCalculado.toFixed(2)}</span>
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
                    whileHover={tarjetaHabilitada ? { scale: 1.02 } : undefined}
                    whileTap={tarjetaHabilitada ? { scale: 0.98 } : undefined}
                    onClick={() => {
                      if (!tarjetaHabilitada) return;
                      setMetodoPago("tarjeta");
                    }}
                    className={`payment-option ${metodoPago === "tarjeta" ? "active" : ""} ${!tarjetaHabilitada ? "disabled" : ""}`}
                  >
                    <div className="payment-icon">💳</div>
                    <div className="payment-text">
                      <div className="payment-name">Tarjeta</div>
                      <div className="payment-desc">Débito o Crédito</div>
                      {!tarjetaHabilitada && (
                        <div className="payment-soon">Muy pronto</div>
                      )}
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

                {metodoPago === "transferencia" && (
                  <div className="transferencia-detalles">
                    <p className="transferencia-title">Cuentas para depósito</p>

                    {cargandoCuentas ? (
                      <p className="transferencia-empty">Cargando cuentas...</p>
                    ) : cuentasBancarias.length === 0 ? (
                      <p className="transferencia-empty">
                        No hay cuentas configuradas.
                      </p>
                    ) : (
                      <div className="cuentas-lista">
                        {cuentasBancarias.map((cuenta) => (
                          <div key={cuenta.id} className="cuenta-item">
                            <p className="cuenta-banco">{cuenta.banco}</p>
                            <p className="cuenta-texto">
                              Titular: {cuenta.nombre_titular}
                            </p>
                            <p className="cuenta-texto">
                              Cuenta: {cuenta.cuenta}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <a
                      href={enlaceWhatsApp || "#"}
                      onClick={(e) => {
                        if (!enlaceWhatsApp) e.preventDefault();
                      }}
                      target="_blank"
                      rel="noreferrer"
                      className={`whatsapp-comprobante-btn ${!enlaceWhatsApp ? "disabled" : ""}`}
                    >
                      <span className="whatsapp-comprobante-icon">📲</span>
                      <span className="whatsapp-comprobante-content">
                        <span className="whatsapp-comprobante-title">
                          Enviar comprobante por WhatsApp
                        </span>
                        <span className="whatsapp-comprobante-phone">
                          {telefonoWhatsAppMostrado()}
                        </span>
                      </span>
                    </a>
                  </div>
                )}
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
                    L {subtotalProductos.toFixed(2)}
                  </span>
                </div>

                <div className="summary-row">
                  <span className="summary-label">Costo de envío</span>
                  <span className="summary-value">
                    L {costoEnvioCalculado.toFixed(2)}
                  </span>
                </div>

                <div className="section-divider" />

                <div className="total-row">
                  <span className="total-label">Total</span>
                  <span className="total-value">
                    L {totalCarrito.toFixed(2)}
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
