import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerPanelRepartidor,
  suscribirsePanelRepartidor,
} from "../../services/panel.service";
import type { PanelRepartidor } from "../../types/panel.types";
import Header from "../../components/Header";
import {
  FaTruck,
  FaMoneyBillWave,
  FaStar,
  FaBox,
  FaClock,
  FaMapMarkerAlt,
} from "react-icons/fa";

export default function DashboardRepartidor() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState<PanelRepartidor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario || usuario.tipo_usuario !== "repartidor") {
      navigate("/");
      return;
    }

    cargarPanel();

    // Suscripción en tiempo real
    const unsubscribe = suscribirsePanelRepartidor(usuario.id, (data) => {
      if (data) setPanel(data);
    });

    return () => {
      unsubscribe();
    };
  }, [usuario, navigate]);

  const cargarPanel = async () => {
    if (!usuario) return;

    setLoading(true);
    const data = await obtenerPanelRepartidor(usuario.id);
    setPanel(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando panel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!panel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20">
      <Header />

      <div className="container mx-auto px-4 py-6">
        {/* Header del Repartidor */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {panel.nombre_completo.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">
                {panel.nombre_completo}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500">
                  {panel.tipo_vehiculo}
                </span>
                <span className="text-gray-300">•</span>
                <div className="flex items-center">
                  <FaStar className="text-yellow-400 mr-1" />
                  <span className="font-semibold">
                    {panel.calificacion_promedio.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            <div
              className={`px-4 py-2 rounded-full font-semibold ${
                panel.disponible
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {panel.disponible ? "Disponible" : "No disponible"}
            </div>
          </div>
        </div>

        {/* Estadísticas del Día */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Entregas Hoy
                </p>
                <p className="text-4xl font-bold mt-2">{panel.entregas_hoy}</p>
              </div>
              <FaTruck className="text-5xl text-white opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Ganancias Hoy
                </p>
                <p className="text-4xl font-bold mt-2">
                  L {panel.ganancias_hoy.toFixed(2)}
                </p>
              </div>
              <FaMoneyBillWave className="text-5xl text-white opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Total Entregas
                </p>
                <p className="text-4xl font-bold mt-2">
                  {panel.total_entregas}
                </p>
              </div>
              <FaBox className="text-5xl text-white opacity-20" />
            </div>
          </div>
        </div>

        {/* Estadísticas del Mes */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Resumen del Mes
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-600 text-sm">Entregas del Mes</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {panel.entregas_mes}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-600 text-sm">Ganancias del Mes</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                L {panel.ganancias_mes.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Pedido Activo */}
        {panel.pedido_activo ? (
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg p-6 text-white mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">🚚 Entrega Activa</h2>
              <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-semibold">
                {panel.pedido_activo.estado}
              </span>
            </div>

            <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-4">
              <p className="text-orange-100 text-sm">Pedido</p>
              <p className="text-2xl font-bold">
                {panel.pedido_activo.numero_pedido}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <FaMapMarkerAlt className="mr-3 text-xl" />
                <div>
                  <p className="text-orange-100 text-sm">Restaurante</p>
                  <p className="font-semibold">
                    {panel.pedido_activo.restaurante}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <FaMapMarkerAlt className="mr-3 text-xl" />
                <div>
                  <p className="text-orange-100 text-sm">Entregar en</p>
                  <p className="font-semibold">
                    {panel.pedido_activo.direccion_entrega}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaClock className="mr-3 text-xl" />
                  <div>
                    <p className="text-orange-100 text-sm">
                      Tiempo transcurrido
                    </p>
                    <p className="font-semibold">
                      {Math.round(panel.pedido_activo.tiempo_transcurrido)} min
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-orange-100 text-sm">Total</p>
                  <p className="text-2xl font-bold">
                    L {panel.pedido_activo.total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/repartidor/entrega-activa")}
              className="w-full bg-white text-orange-600 font-bold py-3 rounded-xl mt-4 hover:bg-orange-50 transition"
            >
              Ver Detalles de la Entrega
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Sin entregas activas
            </h3>
            <p className="text-gray-600">
              Revisa los pedidos disponibles para empezar
            </p>
            <button
              onClick={() => navigate("/repartidor/pedidos-disponibles")}
              className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Ver Pedidos Disponibles
            </button>
          </div>
        )}

        {/* Accesos Rápidos */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/repartidor/pedidos-disponibles")}
            className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition"
          >
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-bold text-gray-800">Pedidos Disponibles</h3>
            <p className="text-sm text-gray-600 mt-1">
              Ver pedidos por asignar
            </p>
          </button>

          <button
            onClick={() => navigate("/repartidor/mis-pedidos")}
            className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition"
          >
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-bold text-gray-800">Mis Pedidos</h3>
            <p className="text-sm text-gray-600 mt-1">Historial de entregas</p>
          </button>
        </div>
      </div>
    </div>
  );
}
