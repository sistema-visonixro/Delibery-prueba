import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  obtenerPanelOperador,
  suscribirsePanelOperador,
} from "../services/panel.service";
import type { PanelOperador } from "../types/panel.types";
import Header from "../components/Header";
import {
  FaShoppingBag,
  FaTruck,
  FaStore,
  FaClock,
  FaExclamationCircle,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";

export default function DashboardOperador() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState<PanelOperador | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario || usuario.tipo_usuario !== "operador") {
      navigate("/");
      return;
    }

    cargarPanel();

    // Suscripción en tiempo real
    const unsubscribe = suscribirsePanelOperador((data) => {
      if (data) setPanel(data);
    });

    // Actualizar cada 30 segundos
    const interval = setInterval(cargarPanel, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [usuario, navigate]);

  const cargarPanel = async () => {
    setLoading(true);
    const data = await obtenerPanelOperador();
    setPanel(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando panel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!panel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            No se pudo cargar la información del panel
          </div>
        </div>
      </div>
    );
  }

  const totalPedidosActivos =
    panel.pedidos_pendientes +
    panel.pedidos_confirmados +
    panel.pedidos_en_preparacion +
    panel.pedidos_listos +
    panel.pedidos_en_camino;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 pb-20">
      <Header />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
          <h1 className="text-3xl font-bold mb-2">🎯 Panel de Operador</h1>
          <p className="text-purple-100">
            Control y monitoreo en tiempo real del sistema
          </p>
          <p className="text-sm text-purple-200 mt-2">
            Última actualización:{" "}
            {new Date(panel.actualizado_en).toLocaleTimeString()}
          </p>
        </div>

        {/* Alertas Críticas */}
        {(panel.pedidos_retrasados > 0 || panel.pedidos_sin_repartidor > 0) && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl">
            <div className="flex items-start">
              <FaExclamationCircle className="text-red-600 text-3xl mr-3 mt-1" />
              <div className="flex-1">
                <p className="font-bold text-red-800 text-lg">
                  ⚠️ Alertas Críticas
                </p>
                <div className="mt-2 space-y-1">
                  {panel.pedidos_retrasados > 0 && (
                    <p className="text-red-700">
                      • {panel.pedidos_retrasados} pedido(s) retrasado(s) (+30
                      min)
                    </p>
                  )}
                  {panel.pedidos_sin_repartidor > 0 && (
                    <p className="text-red-700">
                      • {panel.pedidos_sin_repartidor} pedido(s) sin repartidor
                      asignado
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estados de Pedidos en Tiempo Real */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📦 Pedidos en Tiempo Real
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
              <FaClock className="text-3xl text-yellow-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-yellow-700">
                {panel.pedidos_pendientes}
              </p>
              <p className="text-sm text-gray-600 mt-1">Pendientes</p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
              <FaCheckCircle className="text-3xl text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-blue-700">
                {panel.pedidos_confirmados}
              </p>
              <p className="text-sm text-gray-600 mt-1">Confirmados</p>
            </div>

            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 text-center">
              <FaSpinner className="text-3xl text-orange-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-orange-700">
                {panel.pedidos_en_preparacion}
              </p>
              <p className="text-sm text-gray-600 mt-1">En Preparación</p>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
              <FaShoppingBag className="text-3xl text-purple-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-purple-700">
                {panel.pedidos_listos}
              </p>
              <p className="text-sm text-gray-600 mt-1">Listos</p>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
              <FaTruck className="text-3xl text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-green-700">
                {panel.pedidos_en_camino}
              </p>
              <p className="text-sm text-gray-600 mt-1">En Camino</p>
            </div>
          </div>

          <div className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">
                Total Pedidos Activos
              </span>
              <span className="text-4xl font-bold">{totalPedidosActivos}</span>
            </div>
          </div>
        </div>

        {/* Métricas del Día */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
            <p className="text-green-100 text-sm font-medium">Entregados Hoy</p>
            <p className="text-4xl font-bold mt-2">
              {panel.pedidos_entregados_hoy}
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
            <p className="text-red-100 text-sm font-medium">Cancelados Hoy</p>
            <p className="text-4xl font-bold mt-2">
              {panel.pedidos_cancelados_hoy}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
            <p className="text-blue-100 text-sm font-medium">Ingresos Hoy</p>
            <p className="text-3xl font-bold mt-2">
              L {panel.ingresos_hoy.toFixed(2)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
            <p className="text-purple-100 text-sm font-medium">Tiempo Prom.</p>
            <p className="text-3xl font-bold mt-2">
              {Math.round(panel.tiempo_promedio_entrega_hoy)} min
            </p>
          </div>
        </div>

        {/* Recursos del Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                🚚 Repartidores
              </h3>
              <FaTruck className="text-3xl text-blue-500" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Disponibles</span>
                <span className="text-2xl font-bold text-green-600">
                  {panel.repartidores_disponibles}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-gray-700">En Entrega</span>
                <span className="text-2xl font-bold text-orange-600">
                  {panel.repartidores_en_entrega}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Activos</span>
                <span className="text-2xl font-bold text-blue-600">
                  {panel.repartidores_activos}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Total</span>
                <span className="text-2xl font-bold text-gray-800">
                  {panel.total_repartidores}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                🏪 Restaurantes
              </h3>
              <FaStore className="text-3xl text-orange-500" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Activos</span>
                <span className="text-3xl font-bold text-green-600">
                  {panel.restaurantes_activos}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Total</span>
                <span className="text-3xl font-bold text-gray-800">
                  {panel.total_restaurantes}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas del Mes */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Resumen del Mes
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-gray-600 text-sm">Pedidos Completados</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {panel.pedidos_completados_mes}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-gray-600 text-sm">Ingresos del Mes</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                L {panel.ingresos_mes.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Pedidos Urgentes */}
        {panel.pedidos_urgentes && panel.pedidos_urgentes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              🚨 Pedidos Urgentes ({panel.pedidos_urgentes.length})
            </h2>
            <div className="space-y-3">
              {panel.pedidos_urgentes.map((pedido) => (
                <div
                  key={pedido.pedido_id}
                  className="bg-red-50 border-2 border-red-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">
                        {pedido.numero_pedido}
                      </p>
                      <p className="text-sm text-gray-600">
                        {pedido.restaurante}
                      </p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            pedido.estado === "pendiente"
                              ? "bg-yellow-100 text-yellow-700"
                              : pedido.estado === "confirmado"
                                ? "bg-blue-100 text-blue-700"
                                : pedido.estado === "en_preparacion"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {pedido.estado}
                        </span>
                        <span className="text-xs text-gray-500">
                          ⏱️ {Math.round(pedido.tiempo_transcurrido)} min
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            pedido.tiene_repartidor
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {pedido.tiene_repartidor
                            ? "✓ Con repartidor"
                            : "✗ Sin repartidor"}
                        </span>
                      </div>
                    </div>
                    <button className="ml-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition">
                      Ver Detalles
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-bold text-gray-800">Todos los Pedidos</h3>
            <p className="text-sm text-gray-600 mt-1">Ver historial completo</p>
          </button>

          <button className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition">
            <div className="text-3xl mb-2">🚚</div>
            <h3 className="font-bold text-gray-800">Gestionar Repartidores</h3>
            <p className="text-sm text-gray-600 mt-1">Estado y asignaciones</p>
          </button>

          <button className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition">
            <div className="text-3xl mb-2">🏪</div>
            <h3 className="font-bold text-gray-800">Gestionar Restaurantes</h3>
            <p className="text-sm text-gray-600 mt-1">
              Ver todos los restaurantes
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
