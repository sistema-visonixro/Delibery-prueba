import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  obtenerPanelAdmin,
  suscribirsePanelAdmin,
} from "../services/panel.service";
import type { PanelAdmin } from "../types/panel.types";
import Header from "../components/Header";
import {
  FaUsers,
  FaShoppingBag,
  FaMoneyBillWave,
  FaTruck,
  FaStore,
  FaChartLine,
  FaClock,
  FaTrophy,
} from "react-icons/fa";

export default function DashboardAdmin() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState<PanelAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario || usuario.tipo_usuario !== "admin") {
      navigate("/");
      return;
    }

    cargarPanel();

    // Suscripción en tiempo real
    const unsubscribe = suscribirsePanelAdmin((data) => {
      if (data) setPanel(data);
    });

    // Actualizar cada minuto
    const interval = setInterval(cargarPanel, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [usuario, navigate]);

  const cargarPanel = async () => {
    setLoading(true);
    const data = await obtenerPanelAdmin();
    setPanel(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-white">Cargando panel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!panel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            No se pudo cargar la información del panel
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pb-20">
      <Header />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl shadow-2xl p-8 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                👑 Panel de Administración
              </h1>
              <p className="text-purple-100 text-lg">
                Vista completa del sistema Delibery
              </p>
              <p className="text-sm text-purple-200 mt-2">
                Actualizado: {new Date(panel.actualizado_en).toLocaleString()}
              </p>
            </div>
            <div className="text-6xl">📊</div>
          </div>
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 text-white">
            <FaUsers className="text-3xl mb-2 opacity-80" />
            <p className="text-blue-100 text-sm">Total Usuarios</p>
            <p className="text-4xl font-bold mt-1">{panel.total_usuarios}</p>
            <p className="text-xs text-blue-200 mt-2">
              +{panel.usuarios_nuevos_hoy} hoy
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl shadow-lg p-6 text-white">
            <FaShoppingBag className="text-3xl mb-2 opacity-80" />
            <p className="text-green-100 text-sm">Pedidos Totales</p>
            <p className="text-4xl font-bold mt-1">
              {panel.total_pedidos_historico}
            </p>
            <p className="text-xs text-green-200 mt-2">
              {panel.pedidos_hoy} hoy
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg p-6 text-white">
            <FaMoneyBillWave className="text-3xl mb-2 opacity-80" />
            <p className="text-purple-100 text-sm">Ingresos Totales</p>
            <p className="text-3xl font-bold mt-1">
              L {panel.ingresos_totales.toFixed(0)}
            </p>
            <p className="text-xs text-purple-200 mt-2">
              L {panel.ingresos_hoy.toFixed(0)} hoy
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-700 rounded-xl shadow-lg p-6 text-white">
            <FaChartLine className="text-3xl mb-2 opacity-80" />
            <p className="text-orange-100 text-sm">Tasa Completación</p>
            <p className="text-4xl font-bold mt-1">
              {panel.tasa_completacion_porcentaje}%
            </p>
            <p className="text-xs text-orange-200 mt-2">Global</p>
          </div>
        </div>

        {/* Métricas del Día */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📅 Métricas de Hoy
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <p className="text-gray-600 text-sm">Pedidos Hoy</p>
              <p className="text-3xl font-bold text-blue-600">
                {panel.pedidos_hoy}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <p className="text-gray-600 text-sm">Ingresos Hoy</p>
              <p className="text-2xl font-bold text-green-600">
                L {panel.ingresos_hoy.toFixed(2)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <p className="text-gray-600 text-sm">Ticket Promedio</p>
              <p className="text-2xl font-bold text-purple-600">
                L {panel.ticket_promedio.toFixed(2)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
              <p className="text-gray-600 text-sm">Tiempo Entrega</p>
              <p className="text-3xl font-bold text-orange-600">
                {Math.round(panel.tiempo_promedio_entrega_hoy)}m
              </p>
            </div>
          </div>
        </div>

        {/* Distribución de Estados */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📊 Distribución de Pedidos
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700">
                {panel.distribucion_estados.pendiente}
              </p>
              <p className="text-xs text-gray-600 mt-1">Pendiente</p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {panel.distribucion_estados.confirmado}
              </p>
              <p className="text-xs text-gray-600 mt-1">Confirmado</p>
            </div>
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-700">
                {panel.distribucion_estados.en_preparacion}
              </p>
              <p className="text-xs text-gray-600 mt-1">Preparando</p>
            </div>
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">
                {panel.distribucion_estados.listo}
              </p>
              <p className="text-xs text-gray-600 mt-1">Listo</p>
            </div>
            <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-indigo-700">
                {panel.distribucion_estados.en_camino}
              </p>
              <p className="text-xs text-gray-600 mt-1">En Camino</p>
            </div>
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">
                {panel.distribucion_estados.entregado}
              </p>
              <p className="text-xs text-gray-600 mt-1">Entregado</p>
            </div>
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-700">
                {panel.distribucion_estados.cancelado}
              </p>
              <p className="text-xs text-gray-600 mt-1">Cancelado</p>
            </div>
          </div>
        </div>

        {/* Recursos del Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Restaurantes */}
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">🏪 Restaurantes</h3>
              <FaStore className="text-4xl opacity-50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <p className="text-orange-100 text-sm">Activos</p>
                <p className="text-4xl font-bold">
                  {panel.restaurantes_activos}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <p className="text-orange-100 text-sm">Total</p>
                <p className="text-4xl font-bold">{panel.total_restaurantes}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-xl p-4 col-span-2">
                <p className="text-orange-100 text-sm">Productos</p>
                <p className="text-2xl font-bold">
                  {panel.total_platillos} platillos • {panel.total_bebidas}{" "}
                  bebidas
                </p>
              </div>
            </div>
          </div>

          {/* Repartidores */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">🚚 Repartidores</h3>
              <FaTruck className="text-4xl opacity-50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <p className="text-blue-100 text-sm">Disponibles</p>
                <p className="text-4xl font-bold">
                  {panel.repartidores_disponibles}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <p className="text-blue-100 text-sm">En Entrega</p>
                <p className="text-4xl font-bold">
                  {panel.repartidores_en_entrega}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <p className="text-blue-100 text-sm">Total</p>
                <p className="text-3xl font-bold">{panel.total_repartidores}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <p className="text-blue-100 text-sm">⭐ Calificación</p>
                <p className="text-3xl font-bold">
                  {panel.calificacion_promedio_repartidores.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Restaurantes */}
        {panel.top_restaurantes_mes &&
          panel.top_restaurantes_mes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <FaTrophy className="text-yellow-500 text-2xl mr-2" />
                <h2 className="text-2xl font-bold text-gray-800">
                  🏆 Top 5 Restaurantes del Mes
                </h2>
              </div>
              <div className="space-y-3">
                {panel.top_restaurantes_mes.map((rest, index) => (
                  <div
                    key={rest.id}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      index === 0
                        ? "bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      <span className="text-3xl">{rest.emoji}</span>
                      <div>
                        <p className="font-bold text-gray-800">{rest.nombre}</p>
                        <p className="text-sm text-gray-600">
                          {rest.total_pedidos} pedidos
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        L {rest.ingresos.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Top Repartidores */}
        {panel.top_repartidores_mes &&
          panel.top_repartidores_mes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <FaTrophy className="text-blue-500 text-2xl mr-2" />
                <h2 className="text-2xl font-bold text-gray-800">
                  🏆 Top 5 Repartidores del Mes
                </h2>
              </div>
              <div className="space-y-3">
                {panel.top_repartidores_mes.map((rep, index) => (
                  <div
                    key={rep.id}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      index === 0
                        ? "bg-gradient-to-r from-blue-100 to-indigo-200 border-2 border-blue-400"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-gray-800">
                          {rep.nombre_completo}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-600">
                            {rep.entregas_mes} entregas
                          </span>
                          <span className="text-yellow-500">
                            ⭐ {rep.calificacion_promedio.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        L {rep.ganancias_mes.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">ganancias</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Estadísticas del Mes */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
          <h2 className="text-2xl font-bold mb-4">📈 Resumen del Mes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <p className="text-indigo-100 text-sm">Nuevos Usuarios</p>
              <p className="text-3xl font-bold">{panel.usuarios_nuevos_mes}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <p className="text-indigo-100 text-sm">Pedidos</p>
              <p className="text-3xl font-bold">{panel.pedidos_mes}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <p className="text-indigo-100 text-sm">Completados</p>
              <p className="text-3xl font-bold">
                {panel.total_pedidos_completados}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <p className="text-indigo-100 text-sm">Ingresos</p>
              <p className="text-2xl font-bold">
                L {panel.ingresos_mes.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Tiempos de Entrega */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <FaClock className="text-blue-500 text-2xl mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">
              ⏱️ Tiempos de Entrega
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-gray-600 text-sm">Promedio Global</p>
              <p className="text-4xl font-bold text-blue-600">
                {Math.round(panel.tiempo_promedio_entrega_global)} min
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-gray-600 text-sm">Promedio Hoy</p>
              <p className="text-4xl font-bold text-green-600">
                {Math.round(panel.tiempo_promedio_entrega_hoy)} min
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
