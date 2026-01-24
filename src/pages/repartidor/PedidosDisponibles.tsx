import { useEffect, useState } from "react";
import {
  obtenerPedidosDisponibles,
  tomarPedido,
  suscribirseAPedidosDisponibles,
} from "../../services/repartidor.service";
import type { PedidoDisponible } from "../../types/repartidor.types";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";
import InfoModal from "../../components/InfoModal";
import { useInfoModal } from "../../hooks/useInfoModal";

export default function PedidosDisponibles() {
  const { usuario } = useAuth();
  const { modalState, showSuccess, showError, closeModal } = useInfoModal();
  const [pedidos, setPedidos] = useState<PedidoDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [tomandoPedido, setTomandoPedido] = useState<string | null>(null);

  useEffect(() => {
    cargarPedidos();

    // Suscribirse a cambios en tiempo real
    const unsubscribe = suscribirseAPedidosDisponibles((nuevosPedidos) => {
      setPedidos(nuevosPedidos);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const cargarPedidos = async () => {
    try {
      const data = await obtenerPedidosDisponibles();
      setPedidos(data);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTomarPedido = async (pedidoId: string) => {
    if (!usuario) return;

    setTomandoPedido(pedidoId);
    try {
      await tomarPedido(pedidoId, usuario.id);
      showSuccess(
        '¡Pedido asignado! Ve a "Mis Pedidos" para comenzar la entrega.',
      );
      await cargarPedidos();
    } catch (error) {
      console.error("Error al tomar pedido:", error);
      showError("No se pudo tomar el pedido. Intenta de nuevo.");
    } finally {
      setTomandoPedido(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">📦 Pedidos Disponibles</h1>

        {pedidos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">
              No hay pedidos disponibles en este momento
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Los nuevos pedidos aparecerán aquí automáticamente
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div
                key={pedido.pedido_id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {pedido.restaurante_emoji} {pedido.restaurante_nombre}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {pedido.restaurante_direccion}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">
                      L {pedido.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {pedido.total_items} item
                      {pedido.total_items > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <div className="flex items-start space-x-2 mb-2">
                    <span className="text-gray-500">📍</span>
                    <div>
                      <p className="text-sm font-medium">Entrega en:</p>
                      <p className="text-gray-700">
                        {pedido.direccion_entrega}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>⏱️</span>
                    <p>
                      Hace {Math.floor(pedido.minutos_desde_creacion)} minutos
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      pedido.estado === "listo"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {pedido.estado === "listo"
                      ? "✅ Listo"
                      : "⏳ En preparación"}
                  </span>

                  <button
                    onClick={() => handleTomarPedido(pedido.pedido_id)}
                    disabled={tomandoPedido === pedido.pedido_id}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {tomandoPedido === pedido.pedido_id
                      ? "⏳ Tomando..."
                      : "🚀 Tomar Pedido"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
