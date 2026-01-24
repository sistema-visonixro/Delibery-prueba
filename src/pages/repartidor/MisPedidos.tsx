import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerMisPedidos,
  suscribirseAMisPedidos,
} from "../../services/repartidor.service";
import type { PedidoRepartidor } from "../../types/repartidor.types";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";

export default function MisPedidos() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<PedidoRepartidor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario) return;

    cargarPedidos();

    // Suscribirse a cambios en tiempo real
    const unsubscribe = suscribirseAMisPedidos(usuario.id, (nuevosPedidos) => {
      setPedidos(nuevosPedidos);
    });

    return () => {
      unsubscribe();
    };
  }, [usuario]);

  const cargarPedidos = async () => {
    if (!usuario) return;

    try {
      const data = await obtenerMisPedidos(usuario.id);
      setPedidos(data);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">📦 Mis Pedidos</h1>
          <button
            onClick={() => navigate("/repartidor/disponibles")}
            className="text-indigo-600 hover:underline text-sm"
          >
            Ver disponibles →
          </button>
        </div>

        {pedidos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">
              No tienes pedidos asignados
            </p>
            <button
              onClick={() => navigate("/repartidor/disponibles")}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              Ver Pedidos Disponibles
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div
                key={pedido.pedido_id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {pedido.restaurante_emoji} {pedido.restaurante_nombre}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Pedido #{pedido.numero_pedido}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">
                      L {pedido.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {pedido.total_items} items
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <div className="flex items-start space-x-2 mb-3">
                    <span className="text-gray-500">📍</span>
                    <div>
                      <p className="text-sm font-medium">Entregar en:</p>
                      <p className="text-gray-700">
                        {pedido.direccion_entrega}
                      </p>
                    </div>
                  </div>

                  {pedido.notas_cliente && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-yellow-800 mb-1">
                        💬 Notas del cliente:
                      </p>
                      <p className="text-gray-700 text-sm">
                        {pedido.notas_cliente}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>⏱️</span>
                    <p>
                      Asignado hace{" "}
                      {Math.floor(pedido.minutos_desde_asignacion)} minutos
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    navigate(`/repartidor/entrega/${pedido.pedido_id}`)
                  }
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  🚀 Iniciar Entrega
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
