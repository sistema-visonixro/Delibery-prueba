import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  obtenerMisPedidos,
  marcarPedidoEntregado,
  iniciarTrackingGPS,
  obtenerPerfilRepartidor,
} from "../../services/repartidor.service";
import type { PedidoRepartidor } from "../../types/repartidor.types";
import { useAuth } from "../../context/AuthContext";
import MapaTracking from "../../components/MapaTracking";
import InfoModal from "../../components/InfoModal";
import { useInfoModal } from "../../hooks/useInfoModal";
import ConfirmModal from "../../components/ConfirmModal";

export default function EntregaActiva() {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { modalState, showError, showSuccess, closeModal } = useInfoModal();

  const [pedido, setPedido] = useState<PedidoRepartidor | null>(null);
  const [loading, setLoading] = useState(true);
  const [entregando, setEntregando] = useState(false);
  const [trackingActivo, setTrackingActivo] = useState(false);
  const [showConfirmEntrega, setShowConfirmEntrega] = useState(false);

  const detenerTrackingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    cargarDatos();

    return () => {
      // Detener tracking al desmontar componente
      if (detenerTrackingRef.current) {
        detenerTrackingRef.current();
      }
    };
  }, [pedidoId]);

  const cargarDatos = async () => {
    if (!usuario || !pedidoId) return;

    try {
      const [pedidosData, repartidorData] = await Promise.all([
        obtenerMisPedidos(usuario.id),
        obtenerPerfilRepartidor(usuario.id),
      ]);

      const pedidoActual = pedidosData.find((p) => p.pedido_id === pedidoId);
      if (!pedidoActual) {
        showError("Pedido no encontrado");
        navigate("/repartidor/mis-pedidos");
        return;
      }

      setPedido(pedidoActual);

      // Iniciar tracking automático
      if (repartidorData) {
        iniciarTracking(repartidorData.id);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const iniciarTracking = (repartidorId: string) => {
    if (!pedidoId || trackingActivo) return;

    console.log("Iniciando tracking GPS...");
    const detener = iniciarTrackingGPS(repartidorId, pedidoId, 5); // Actualizar cada 5 segundos
    detenerTrackingRef.current = detener;
    setTrackingActivo(true);
  };

  const handleMarcarEntregado = async () => {
    if (!usuario || !pedidoId) return;
    setShowConfirmEntrega(true);
  };

  const confirmarMarcarEntregado = async () => {
    if (!usuario || !pedidoId) return;
    setShowConfirmEntrega(false);

    setEntregando(true);
    try {
      await marcarPedidoEntregado(pedidoId, usuario.id);

      // Detener tracking
      if (detenerTrackingRef.current) {
        detenerTrackingRef.current();
      }

      showSuccess("¡Pedido marcado como entregado! ¡Buen trabajo!");
      setTimeout(() => navigate("/repartidor/mis-pedidos"), 1500);
    } catch (error) {
      console.error("Error al marcar como entregado:", error);
      showError("Error al marcar el pedido como entregado");
    } finally {
      setEntregando(false);
    }
  };

  const abrirNavegacion = () => {
    if (!pedido) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${pedido.latitud},${pedido.longitud}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Pedido no encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">🚚 Entrega en Curso</h1>
            <p className="text-gray-600">Pedido #{pedido.numero_pedido}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-indigo-600">
              L {pedido.total.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">{pedido.total_items} items</p>
          </div>
        </div>

        {trackingActivo && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <span className="animate-pulse text-green-600">●</span>
              <p className="text-green-700 text-sm font-medium">
                📡 Tracking GPS activo - Tu ubicación se actualiza cada minuto
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Información del Restaurante */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <h2 className="text-lg font-semibold mb-3">
          {pedido.restaurante_emoji} Recoger en:
        </h2>
        <p className="text-xl font-medium mb-2">{pedido.restaurante_nombre}</p>
        <p className="text-gray-600 mb-2">{pedido.restaurante_direccion}</p>
        {pedido.restaurante_telefono && (
          <a
            href={`tel:${pedido.restaurante_telefono}`}
            className="text-indigo-600 hover:underline"
          >
            📞 {pedido.restaurante_telefono}
          </a>
        )}
      </div>

      {/* Información de Entrega */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <h2 className="text-lg font-semibold mb-3">📍 Entregar en:</h2>
        <p className="text-gray-900 text-lg mb-3">{pedido.direccion_entrega}</p>

        {pedido.notas_cliente && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <p className="text-sm font-medium text-yellow-800 mb-1">
              💬 Notas del cliente:
            </p>
            <p className="text-gray-700">{pedido.notas_cliente}</p>
          </div>
        )}

        <p className="text-gray-600 text-sm mb-3">
          Cliente: {pedido.cliente_email}
        </p>

        <button
          onClick={abrirNavegacion}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          🗺️ Abrir Navegación GPS
        </button>
      </div>

      {/* Mapa de Tracking */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <h2 className="text-lg font-semibold mb-3">🗺️ Mapa de Entrega</h2>
        <MapaTracking
          pedidoId={pedidoId!}
          clienteLat={pedido.latitud}
          clienteLng={pedido.longitud}
        />
      </div>

      {/* Botón de Entregar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <button
          onClick={handleMarcarEntregado}
          disabled={entregando}
          className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-bold"
        >
          {entregando ? "⏳ Marcando..." : "✅ Marcar como Entregado"}
        </button>
        <p className="text-center text-gray-500 text-sm mt-2">
          Solo marca como entregado cuando hayas confirmado la entrega con el
          cliente
        </p>
      </div>

      <InfoModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />

      <ConfirmModal
        visible={showConfirmEntrega}
        title="Confirmar Entrega"
        description="¿Confirmas que el pedido fue entregado al cliente? Esta acción no se puede deshacer."
        onCancel={() => setShowConfirmEntrega(false)}
        onConfirm={confirmarMarcarEntregado}
        confirmLabel="Sí, confirmar"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
