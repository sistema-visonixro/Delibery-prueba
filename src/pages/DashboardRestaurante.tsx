import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  obtenerPanelRestaurante,
  suscribirsePanelRestaurante,
} from "../services/panel.service";
import { obtenerRestaurantePorUsuario } from "../services/restaurante.service";
import type { Restaurante } from "../types/restaurante.types";
import type { PanelRestaurante } from "../types/panel.types";
import Header from "../components/Header";
import {
  FaShoppingBag,
  FaMoneyBillWave,
  FaClock,
  FaStar,
  FaUtensils,
  FaCoffee,
  FaExclamationTriangle,
  FaStore,
} from "react-icons/fa";

export default function DashboardRestaurante() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState<PanelRestaurante | null>(null);
  const [loading, setLoading] = useState(true);
  const [restauranteId, setRestauranteId] = useState<string>("");
  const [restauranteExistente, setRestauranteExistente] =
    useState<Restaurante | null>(null);

  useEffect(() => {
    if (!usuario || usuario.tipo_usuario !== "restaurante") {
      navigate("/");
      return;
    }

    // Obtener el restaurante_id asociado al usuario
    obtenerRestauranteId();
  }, [usuario, navigate]);

  useEffect(() => {
    if (!restauranteId) return;

    cargarPanel();

    // Suscripción en tiempo real
    const unsubscribe = suscribirsePanelRestaurante(restauranteId, (data) => {
      if (data) setPanel(data);
    });

    return () => {
      unsubscribe();
    };
  }, [restauranteId]);

  const obtenerRestauranteId = async () => {
    if (!usuario) return;

    // Intentar obtener restaurante asociado al usuario
    const restaurante = await obtenerRestaurantePorUsuario(usuario.id);
    if (restaurante) {
      setRestauranteExistente(restaurante);
      setRestauranteId(restaurante.id);
      return;
    }

    // Si no hay restaurante asociado, dejamos restauranteId vacío
    setRestauranteExistente(null);
    setRestauranteId("");
  };

  const cargarPanel = async () => {
    setLoading(true);
    const data = await obtenerPanelRestaurante(restauranteId);
    setPanel(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando panel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!panel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            {restauranteExistente ? (
              // Mostrar info básica del restaurante y accesos rápidos
              <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-4">
                    <span className="text-white text-4xl">
                      {restauranteExistente.emoji || "🍽️"}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-1">
                    {restauranteExistente.nombre}
                  </h1>
                  <p className="text-sm text-gray-600 mb-3">
                    {restauranteExistente.descripcion}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => navigate("/restaurante/gestion")}
                      className="bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm hover:shadow-md"
                    >
                      Editar Restaurante
                    </button>
                    <button
                      onClick={() => navigate("/restaurante/platillos")}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-orange-600"
                    >
                      Agregar Platillo
                    </button>
                    <button
                      onClick={() => navigate("/restaurante/pedidos")}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-600"
                    >
                      Ver Pedidos
                    </button>
                  </div>
                </div>
                <div className="mt-6 text-sm text-gray-600">
                  <p>
                    Tiempo entrega: {restauranteExistente.tiempo_entrega_min}{" "}
                    min
                  </p>
                  <p>Costo envío: L {restauranteExistente.costo_envio}</p>
                  <p>Activo: {restauranteExistente.activo ? "Sí" : "No"}</p>
                </div>
              </div>
            ) : (
              // Pantalla de bienvenida para usuarios sin restaurante
              <div>
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-4">
                      <FaStore className="text-white text-4xl" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                      ¡Bienvenido a Delibery! 🎉
                    </h1>
                    <p className="text-lg text-gray-600 mb-2">
                      Aún no tienes un restaurante registrado
                    </p>
                    <p className="text-gray-500">
                      Comienza creando tu restaurante para empezar a recibir
                      pedidos
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded-xl p-6 mb-8">
                    <h3 className="font-semibold text-gray-800 mb-3">
                      ¿Qué podrás hacer después de crear tu restaurante?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex flex-col items-center">
                        <FaUtensils className="text-orange-500 text-2xl mb-2" />
                        <span className="font-medium">Gestionar tu menú</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <FaShoppingBag className="text-green-500 text-2xl mb-2" />
                        <span className="font-medium">Recibir pedidos</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <FaMoneyBillWave className="text-blue-500 text-2xl mb-2" />
                        <span className="font-medium">Generar ingresos</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/restaurante/gestion")}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center gap-3"
                  >
                    <FaStore className="text-2xl" />
                    Crear Mi Restaurante
                  </button>

                  <p className="text-gray-500 text-sm mt-6">
                    Solo te tomará unos minutos configurar tu restaurante
                  </p>
                </div>

                <div className="mt-8 bg-white/80 backdrop-blur rounded-xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FaExclamationTriangle className="text-yellow-500" />
                    Información Importante
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>
                        Podrás editar toda la información de tu restaurante
                        cuando quieras
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>
                        Necesitarás agregar al menos un platillo para empezar a
                        recibir pedidos
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>
                        Los clientes verán tu restaurante una vez que esté
                        activo
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 pb-20">
      <Header />

      <div className="container mx-auto px-4 py-6">
        {/* Tarjetas de Gestión Rápida */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => navigate("/restaurante/gestion")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <FaUtensils className="text-orange-600 text-2xl" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Gestionar Restaurante
            </h3>
            <p className="text-gray-600 text-sm">
              Edita información, horarios y configuración de tu restaurante
            </p>
          </button>

          <button
            onClick={() => navigate("/restaurante/platillos")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <FaCoffee className="text-green-600 text-2xl" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Gestión de Platillos
            </h3>
            <p className="text-gray-600 text-sm">
              Administra tu menú, precios e imágenes de platillos
            </p>
          </button>

          <button
            onClick={() => navigate("/restaurante/pedidos")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FaShoppingBag className="text-blue-600 text-2xl" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Pedidos del Restaurante
            </h3>
            <p className="text-gray-600 text-sm">
              Visualiza y gestiona todos los pedidos entrantes
            </p>
          </button>
        </div>

        {/* Header del Restaurante */}
        <div
          className="rounded-2xl shadow-lg p-6 mb-6 text-white"
          style={{ backgroundColor: panel.color_tema || "#ff6b6b" }}
        >
          <div className="flex items-center space-x-4">
            <div className="text-6xl">{panel.emoji || "🍽️"}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{panel.nombre}</h1>
              <div className="flex items-center space-x-3 mt-2">
                <div className="flex items-center bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  <FaStar className="text-yellow-300 mr-1" />
                  <span className="font-semibold">
                    {panel.calificacion.toFixed(1)}
                  </span>
                </div>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  <FaClock className="inline mr-1" />
                  {panel.tiempo_entrega_min} min
                </span>
                <span
                  className={`px-3 py-1 rounded-full font-semibold ${
                    panel.activo ? "bg-green-500" : "bg-gray-500"
                  }`}
                >
                  {panel.activo ? "Activo" : "Cerrado"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas de Pedidos Pendientes */}
        {panel.pedidos_pendientes_hoy > 0 && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-xl">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-yellow-600 text-2xl mr-3" />
              <div>
                <p className="font-bold text-yellow-800">
                  Tienes {panel.pedidos_pendientes_hoy} pedido(s) pendiente(s)
                  por confirmar
                </p>
                <p className="text-sm text-yellow-700">
                  Revisa y confirma los pedidos nuevos
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas del Día */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <FaShoppingBag className="text-blue-500 text-2xl" />
              <span className="text-xs text-gray-500">HOY</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {panel.pedidos_hoy}
            </p>
            <p className="text-sm text-gray-600">Pedidos</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <FaClock className="text-orange-500 text-2xl" />
              <span className="text-xs text-gray-500">EN PROCESO</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {panel.pedidos_en_proceso_hoy}
            </p>
            <p className="text-sm text-gray-600">Pedidos</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <FaShoppingBag className="text-green-500 text-2xl" />
              <span className="text-xs text-gray-500">COMPLETADOS</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {panel.pedidos_completados_hoy}
            </p>
            <p className="text-sm text-gray-600">Pedidos</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <FaMoneyBillWave className="text-2xl" />
              <span className="text-xs text-green-100">HOY</span>
            </div>
            <p className="text-3xl font-bold">
              ${panel.ingresos_hoy.toFixed(2)}
            </p>
            <p className="text-sm text-green-100">Ingresos</p>
          </div>
        </div>

        {/* Estadísticas del Mes */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Resumen del Mes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-gray-600 text-sm">Total Pedidos</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {panel.pedidos_mes}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-gray-600 text-sm">Completados</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {panel.pedidos_completados_mes}
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-gray-600 text-sm">Ingresos</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                ${panel.ingresos_mes.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Inventario y Productos */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">🍽️ Platillos</h3>
              <FaUtensils className="text-orange-500 text-2xl" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total</span>
                <span className="text-2xl font-bold text-gray-800">
                  {panel.total_platillos}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Disponibles</span>
                <span className="text-xl font-semibold text-green-600">
                  {panel.platillos_disponibles}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">☕ Bebidas</h3>
              <FaCoffee className="text-blue-500 text-2xl" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total</span>
                <span className="text-2xl font-bold text-gray-800">
                  {panel.total_bebidas}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Disponibles</span>
                <span className="text-xl font-semibold text-green-600">
                  {panel.bebidas_disponibles}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Platillo Más Vendido */}
        {panel.platillo_mas_vendido && (
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg p-6 text-white mb-6">
            <h2 className="text-xl font-bold mb-4">
              ⭐ Platillo Más Vendido del Mes
            </h2>
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <p className="text-2xl font-bold">
                {panel.platillo_mas_vendido.nombre}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg">
                  ${panel.platillo_mas_vendido.precio.toFixed(2)}
                </span>
                <span className="bg-white bg-opacity-30 px-3 py-1 rounded-full">
                  {panel.platillo_mas_vendido.veces_pedido} pedidos
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Pedidos Pendientes */}
        {panel.pedidos_pendientes && panel.pedidos_pendientes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              🔔 Pedidos Pendientes ({panel.pedidos_pendientes.length})
            </h2>
            <div className="space-y-3">
              {panel.pedidos_pendientes.map((pedido) => (
                <div
                  key={pedido.pedido_id}
                  className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-800">
                        {pedido.numero_pedido}
                      </p>
                      <p className="text-sm text-gray-600">
                        {pedido.direccion_entrega}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(pedido.creado_en).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ${pedido.total.toFixed(2)}
                      </p>
                      <button className="mt-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition">
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accesos Rápidos */}
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-bold text-gray-800">Administrar Menú</h3>
            <p className="text-sm text-gray-600 mt-1">Platillos y bebidas</p>
          </button>

          <button className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-bold text-gray-800">Historial</h3>
            <p className="text-sm text-gray-600 mt-1">Ver todos los pedidos</p>
          </button>
        </div>
      </div>
    </div>
  );
}
