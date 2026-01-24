import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "../lib/supabase";

// Iconos personalizados de Leaflet
const iconoCliente = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const iconoRestaurante = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const iconoRepartidor = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface UbicacionUsuario {
  usuario_id: string;
  latitud: number;
  longitud: number;
  velocidad: number | null;
  precision_metros: number | null;
  heading: number | null;
  actualizado_en: string;
}

interface UbicacionesTracking {
  cliente: UbicacionUsuario | null;
  repartidor: UbicacionUsuario | null;
  restaurante: { latitud: number; longitud: number } | null;
}

interface MapaTrackingProps {
  pedidoId: string;
  clienteLat: number;
  clienteLng: number;
}

export default function MapaTracking({
  pedidoId,
  clienteLat,
  clienteLng,
}: MapaTrackingProps) {
  const [ubicaciones, setUbicaciones] = useState<UbicacionesTracking>({
    cliente: null,
    repartidor: null,
    restaurante: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarUbicaciones();

    // Actualizar ubicaciones cada 10 segundos
    const interval = setInterval(() => {
      cargarUbicaciones();
    }, 10000);

    return () => clearInterval(interval);
  }, [pedidoId]);

  const cargarUbicaciones = async () => {
    try {
      console.log("🗺️ Cargando ubicaciones para pedido:", pedidoId);
      setError(null);

      // 1. Obtener datos del pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from("pedidos")
        .select(
          `
          usuario_id,
          repartidor_id,
          restaurante_id,
          restaurantes (
            latitud,
            longitud
          )
        `,
        )
        .eq("id", pedidoId)
        .single();

      if (pedidoError) throw pedidoError;
      console.log("✅ Datos del pedido:", pedidoData);

      // 2. Obtener ubicación del cliente
      console.log("🔍 Buscando ubicación del cliente:", pedidoData.usuario_id);
      const { data: clienteData, error: clienteError } = await supabase
        .from("ubicacion_real")
        .select("*")
        .eq("usuario_id", pedidoData.usuario_id)
        .maybeSingle();

      if (clienteError && clienteError.code !== "PGRST116") {
        throw clienteError;
      }

      if (clienteData) {
        console.log("✅ Ubicación del cliente encontrada:", clienteData);
      } else {
        console.log(
          "ℹ️ No hay ubicación del cliente, usando ubicación del pedido",
        );
      }

      // 3. Obtener ubicación del repartidor si existe
      let repartidorData = null;
      if (pedidoData.repartidor_id) {
        console.log(
          "🔍 Buscando ubicación del repartidor:",
          pedidoData.repartidor_id,
        );
        const { data, error: repartidorError } = await supabase
          .from("ubicacion_real")
          .select("*")
          .eq("usuario_id", pedidoData.repartidor_id)
          .maybeSingle();

        if (repartidorError && repartidorError.code !== "PGRST116") {
          throw repartidorError;
        }

        if (data) {
          console.log("✅ Ubicación del repartidor encontrada:", data);
          repartidorData = data;
        } else {
          console.log("ℹ️ No hay ubicación del repartidor");
        }
      } else {
        console.log("ℹ️ Pedido sin repartidor asignado");
      }

      // 4. Obtener ubicación del restaurante (a veces viene como arreglo)
      const restauranteRecord = Array.isArray(pedidoData.restaurantes)
        ? pedidoData.restaurantes[0]
        : pedidoData.restaurantes;

      const restauranteData = restauranteRecord
        ? {
            latitud: restauranteRecord.latitud,
            longitud: restauranteRecord.longitud,
          }
        : null;

      if (restauranteData) {
        console.log("🍽️ Ubicación del restaurante:", restauranteData);
      }

      setUbicaciones({
        cliente: clienteData,
        repartidor: repartidorData,
        restaurante: restauranteData,
      });

      console.log("✅ Ubicaciones cargadas exitosamente");
      setLoading(false);
    } catch (err) {
      console.error("❌ Error cargando ubicaciones:", err);
      setError("Error al cargar las ubicaciones");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "450px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              border: "4px solid #f3f4f6",
              borderTop: "4px solid #4f46e5",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          ></div>
          <p style={{ color: "#6b7280" }}>Cargando mapa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "32px",
          textAlign: "center",
          background: "#fef2f2",
          borderRadius: "8px",
        }}
      >
        <p style={{ color: "#dc2626", fontWeight: 600 }}>⚠️ {error}</p>
        <button
          onClick={cargarUbicaciones}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Calcular centro del mapa
  const clienteLatActual = ubicaciones.cliente?.latitud || clienteLat;
  const clienteLngActual = ubicaciones.cliente?.longitud || clienteLng;
  let centerLat = clienteLatActual;
  let centerLng = clienteLngActual;

  if (ubicaciones.repartidor) {
    centerLat = (ubicaciones.repartidor.latitud + clienteLatActual) / 2;
    centerLng = (ubicaciones.repartidor.longitud + clienteLngActual) / 2;
  } else if (ubicaciones.restaurante) {
    centerLat = (ubicaciones.restaurante.latitud + clienteLatActual) / 2;
    centerLng = (ubicaciones.restaurante.longitud + clienteLngActual) / 2;
  }

  const center = {
    lat: centerLat,
    lng: centerLng,
  };

  console.log("🗺️ Renderizando mapa con centro:", center);
  console.log("📍 Marcadores:", {
    cliente: { lat: clienteLatActual, lng: clienteLngActual },
    repartidor: ubicaciones.repartidor
      ? {
          lat: ubicaciones.repartidor.latitud,
          lng: ubicaciones.repartidor.longitud,
        }
      : null,
    restaurante: ubicaciones.restaurante,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
        height: "100%",
        background: "#1f2937",
        padding: "16px",
        borderRadius: "8px",
      }}
    >
      {/* Información de tracking */}
      {ubicaciones.repartidor && (
        <div
          style={{
            background: "#374151",
            border: "1px solid #4b5563",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "16px",
            }}
          >
            <div>
              <p style={{ fontSize: "0.875rem", color: "#d1d5db", margin: 0 }}>
                Repartidor actualizado:
              </p>
              <p style={{ fontWeight: 600, margin: 0, color: "#f3f4f6" }}>
                {Math.floor(
                  (Date.now() -
                    new Date(ubicaciones.repartidor.actualizado_en).getTime()) /
                    60000,
                )}{" "}
                min atrás
              </p>
            </div>
            {ubicaciones.repartidor.velocidad && (
              <div>
                <p
                  style={{ fontSize: "0.875rem", color: "#d1d5db", margin: 0 }}
                >
                  Velocidad:
                </p>
                <p style={{ fontWeight: 600, margin: 0, color: "#f3f4f6" }}>
                  {ubicaciones.repartidor.velocidad.toFixed(1)} km/h
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mapa de Leaflet */}
      <div
        style={{
          height: "450px",
          width: "100%",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
          position: "relative",
        }}
      >
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Marcador del Cliente */}
          <Marker
            position={[clienteLatActual, clienteLngActual]}
            icon={iconoCliente}
          >
            <Popup>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 700, margin: 0 }}>🏠 Cliente</p>
                <p style={{ fontSize: "0.875rem", margin: 0 }}>
                  Destino de entrega
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Marcador del Restaurante */}
          {ubicaciones.restaurante && (
            <Marker
              position={[
                ubicaciones.restaurante.latitud,
                ubicaciones.restaurante.longitud,
              ]}
              icon={iconoRestaurante}
            >
              <Popup>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontWeight: 700, margin: 0 }}>🍽️ Restaurante</p>
                  <p style={{ fontSize: "0.875rem", margin: 0 }}>
                    Punto de origen
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marcador del Repartidor */}
          {ubicaciones.repartidor && (
            <Marker
              position={[
                ubicaciones.repartidor.latitud,
                ubicaciones.repartidor.longitud,
              ]}
              icon={iconoRepartidor}
            >
              <Popup>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontWeight: 700, margin: 0 }}>🚚 Repartidor</p>
                  {ubicaciones.repartidor.velocidad && (
                    <p style={{ fontSize: "0.875rem", margin: 0 }}>
                      {ubicaciones.repartidor.velocidad.toFixed(1)} km/h
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Leyenda */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "24px",
          fontSize: "0.875rem",
          color: "#f3f4f6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "16px",
              height: "16px",
              background: "#2563eb",
              borderRadius: "50%",
            }}
          ></div>
          <span>Repartidor</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "16px",
              height: "16px",
              background: "#dc2626",
              borderRadius: "50%",
            }}
          ></div>
          <span>Cliente</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "16px",
              height: "16px",
              background: "#16a34a",
              borderRadius: "50%",
            }}
          ></div>
          <span>Restaurante</span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
