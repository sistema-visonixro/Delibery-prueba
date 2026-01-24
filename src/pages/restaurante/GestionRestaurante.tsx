import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerRestaurantePorId,
  crearRestaurante,
  actualizarRestaurante,
} from "../../services/restaurante.service";
import type { Restaurante } from "../../types/restaurante.types";
import Header from "../../components/Header";
import { FaSave, FaArrowLeft, FaStore, FaClock, FaTruck } from "react-icons/fa";

export default function GestionRestaurante() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [colorTema, setColorTema] = useState("#ff6b6b");
  const [emoji, setEmoji] = useState("🍽️");
  const [tiempoEntrega, setTiempoEntrega] = useState(30);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (!usuario || usuario.tipo_usuario !== "restaurante") {
      navigate("/");
      return;
    }

    cargarRestaurante();
  }, [usuario, navigate]);

  const cargarRestaurante = async () => {
    if (!usuario) return;

    setLoading(true);
    const data = await obtenerRestaurantePorId(usuario.id);

    if (data) {
      setRestaurante(data);
      setNombre(data.nombre);
      setDescripcion(data.descripcion || "");
      setImagenUrl(data.imagen_url || "");
      setColorTema(data.color_tema || "#ff6b6b");
      setEmoji(data.emoji || "🍽️");
      setTiempoEntrega(data.tiempo_entrega_min);
      setCostoEnvio(data.costo_envio);
      setActivo(data.activo);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    setGuardando(true);

    try {
      if (!usuario) return;

      const datos = {
        nombre,
        descripcion: descripcion || undefined,
        imagen_url: imagenUrl || undefined,
        color_tema: colorTema,
        emoji,
        tiempo_entrega_min: tiempoEntrega,
        costo_envio: costoEnvio,
        activo,
      };

      if (restaurante) {
        // Actualizar
        const resultado = await actualizarRestaurante(restaurante.id, datos);
        if (resultado) {
          setMensaje("Restaurante actualizado correctamente");
          setRestaurante(resultado);
        } else {
          setError("Error al actualizar el restaurante");
        }
      } else {
        // Crear
        const resultado = await crearRestaurante(datos, usuario.id);
        if (resultado) {
          setMensaje("Restaurante creado correctamente");
          setRestaurante(resultado);
        } else {
          setError(
            "Error al crear el restaurante. Revisa permisos RLS o token autenticado.",
          );
        }
      }
    } catch (err) {
      setError("Error al guardar el restaurante");
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  const emojis = [
    "🍽️",
    "🍕",
    "🍔",
    "🍜",
    "🍣",
    "🌮",
    "🍗",
    "🍱",
    "🥘",
    "🍝",
    "🥗",
    "🍛",
  ];
  const colores = [
    "#ff6b6b",
    "#ee5a6f",
    "#f06595",
    "#cc5de8",
    "#845ef7",
    "#5c7cfa",
    "#339af0",
    "#22b8cf",
    "#20c997",
    "#51cf66",
    "#94d82d",
    "#ffd43b",
    "#ffa94d",
    "#ff922b",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 pb-20">
      <Header />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate("/restaurante/dashboard")}
            className="mr-4 bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition"
          >
            <FaArrowLeft className="text-orange-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {restaurante ? "Editar Restaurante" : "Crear Restaurante"}
            </h1>
            <p className="text-gray-600">
              Configura la información de tu negocio
            </p>
          </div>
        </div>

        {/* Mensajes */}
        {mensaje && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          {/* Preview */}
          <div
            className="rounded-xl p-6 mb-6 text-white"
            style={{ backgroundColor: colorTema }}
          >
            <div className="flex items-center space-x-4">
              <div className="text-6xl">{emoji}</div>
              <div>
                <h2 className="text-2xl font-bold">
                  {nombre || "Nombre del Restaurante"}
                </h2>
                <p className="text-sm opacity-90">
                  {descripcion || "Descripción del restaurante"}
                </p>
                <div className="flex items-center space-x-3 mt-2">
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    <FaClock className="inline mr-1" />
                    {tiempoEntrega} min
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    <FaTruck className="inline mr-1" />${costoEnvio}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FaStore className="inline mr-2" />
                Nombre del Restaurante *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                placeholder="Ej: La Casa del Sabor"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                placeholder="Describe tu restaurante..."
              />
            </div>

            {/* Imagen URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URL de la Imagen
              </label>
              <input
                type="url"
                value={imagenUrl}
                onChange={(e) => setImagenUrl(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              {imagenUrl && (
                <img
                  src={imagenUrl}
                  alt="Preview"
                  className="mt-3 w-full h-48 object-cover rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>

            {/* Emoji */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Emoji Representativo
              </label>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                {emojis.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-3xl p-3 rounded-xl hover:bg-gray-100 transition ${
                      emoji === e
                        ? "bg-orange-100 ring-2 ring-orange-500"
                        : "bg-gray-50"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Tema */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Color del Tema
              </label>
              <div className="grid grid-cols-7 md:grid-cols-14 gap-2">
                {colores.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColorTema(color)}
                    className={`w-12 h-12 rounded-xl transition ${
                      colorTema === color
                        ? "ring-4 ring-gray-400 scale-110"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Tiempo de Entrega */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tiempo de Entrega (min)
                </label>
                <input
                  type="number"
                  value={tiempoEntrega}
                  onChange={(e) => setTiempoEntrega(Number(e.target.value))}
                  min="10"
                  max="120"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Costo de Envío (Lps)
                </label>
                <input
                  type="number"
                  value={costoEnvio}
                  onChange={(e) => setCostoEnvio(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Estado */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
              <div>
                <p className="font-semibold text-gray-800">
                  Estado del Restaurante
                </p>
                <p className="text-sm text-gray-600">
                  {activo
                    ? "Abierto y aceptando pedidos"
                    : "Cerrado temporalmente"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivo(!activo)}
                className={`relative inline-flex items-center h-8 rounded-full w-16 transition ${
                  activo ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block w-6 h-6 transform bg-white rounded-full transition ${
                    activo ? "translate-x-9" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Botones */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 rounded-xl hover:from-orange-600 hover:to-red-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                {guardando ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    {restaurante
                      ? "Actualizar Restaurante"
                      : "Crear Restaurante"}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/restaurante/dashboard")}
                className="px-6 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
