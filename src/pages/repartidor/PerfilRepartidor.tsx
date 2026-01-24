import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerPerfilRepartidor,
  obtenerEstadisticasRepartidor,
  cambiarDisponibilidad,
} from "../../services/repartidor.service";
import type { Repartidor } from "../../types/repartidor.types";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";
import InfoModal from "../../components/InfoModal";
import { useInfoModal } from "../../hooks/useInfoModal";

interface Estadisticas {
  entregas_completadas: number;
  entregas_en_curso: number;
  ganancias_estimadas: number;
  ultima_entrega_en: string | null;
}

export default function PerfilRepartidor() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { modalState, showError, closeModal } = useInfoModal();
  const [repartidor, setRepartidor] = useState<Repartidor | null>(null);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [cambiandoDisponibilidad, setCambiandoDisponibilidad] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  const cargarDatos = async () => {
    if (!usuario) return;

    try {
      const [perfilData, statsData] = await Promise.all([
        obtenerPerfilRepartidor(usuario.id),
        obtenerEstadisticasRepartidor(usuario.id),
      ]);

      setRepartidor(perfilData);
      setEstadisticas(statsData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDisponibilidad = async () => {
    if (!usuario || !repartidor) return;

    setCambiandoDisponibilidad(true);
    try {
      await cambiarDisponibilidad(usuario.id, !repartidor.disponible);
      await cargarDatos();
    } catch (error) {
      console.error("Error al cambiar disponibilidad:", error);
      showError("Error al cambiar disponibilidad");
    } finally {
      setCambiandoDisponibilidad(false);
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

  if (!repartidor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">
              No tienes un perfil de repartidor
            </p>
            <p className="text-sm text-gray-600">
              Contacta al administrador para registrarte como repartidor
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">👤 Mi Perfil</h1>

        {/* Info del repartidor */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <div className="flex items-center space-x-4 mb-6">
            {repartidor.foto_url ? (
              <img
                src={repartidor.foto_url}
                alt={repartidor.nombre_completo}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-3xl">
                👤
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold">
                {repartidor.nombre_completo}
              </h2>
              {repartidor.telefono && (
                <p className="text-gray-600">📞 {repartidor.telefono}</p>
              )}
              {repartidor.tipo_vehiculo && (
                <p className="text-gray-600 capitalize">
                  🚲 {repartidor.tipo_vehiculo}
                </p>
              )}
            </div>
          </div>

          {/* Toggle disponibilidad */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Estado</p>
                <p className="text-sm text-gray-600">
                  {repartidor.disponible
                    ? "✅ Disponible para pedidos"
                    : "⏸️ No disponible"}
                </p>
              </div>
              <button
                onClick={toggleDisponibilidad}
                disabled={cambiandoDisponibilidad}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  repartidor.disponible
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                } disabled:bg-gray-400`}
              >
                {cambiandoDisponibilidad
                  ? "⏳"
                  : repartidor.disponible
                  ? "Pausar"
                  : "Activar"}
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h2 className="text-lg font-semibold mb-4">📊 Estadísticas</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Entregas</p>
                <p className="text-3xl font-bold text-blue-600">
                  {repartidor.total_entregas}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Calificación</p>
                <p className="text-3xl font-bold text-green-600">
                  ⭐ {repartidor.calificacion_promedio.toFixed(1)}
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Completadas</p>
                <p className="text-3xl font-bold text-purple-600">
                  {estadisticas.entregas_completadas}
                </p>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">En Curso</p>
                <p className="text-3xl font-bold text-orange-600">
                  {estadisticas.entregas_en_curso}
                </p>
              </div>
            </div>

            {estadisticas.ganancias_estimadas > 0 && (
              <div className="mt-4 bg-indigo-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">
                  Ganancias Estimadas
                </p>
                <p className="text-3xl font-bold text-indigo-600">
                  ${estadisticas.ganancias_estimadas.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">🚀 Acciones Rápidas</h2>

          <div className="space-y-3">
            <button
              onClick={() => navigate("/repartidor/disponibles")}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              📦 Ver Pedidos Disponibles
            </button>

            <button
              onClick={() => navigate("/repartidor/mis-pedidos")}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              📋 Mis Pedidos Activos
            </button>

            <button
              onClick={() => navigate("/home")}
              className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              🏠 Volver al Inicio
            </button>
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
