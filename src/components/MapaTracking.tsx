import { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from "@react-google-maps/api";
import { supabase } from "../lib/supabase";

const GOOGLE_MAPS_API_KEY = "AIzaSyD9ZMr4EAvpCy-AW5dg2IsSJeC9bPTUFOQ";

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

const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "0px",
  backgroundColor: "#e5e7eb",
};

// Crear iconos personalizados con SVG
const createCustomIcon = (emoji: string, color: string) => {
  const svg = `
    <svg width="60" height="80" viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feFlood flood-color="#000000" flood-opacity="0.3"/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="M30 5 C15 5 5 15 5 30 C5 45 30 75 30 75 C30 75 55 45 55 30 C55 15 45 5 30 5 Z" 
            fill="${color}" filter="url(#shadow)" stroke="white" stroke-width="2"/>
      <text x="30" y="38" font-size="30" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  // Cargar Google Maps
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    cargarUbicaciones();

    // Actualizar ubicaciones cada 10 segundos
    const interval = setInterval(() => {
      cargarUbicaciones();
    }, 10000);

    return () => clearInterval(interval);
  }, [pedidoId]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

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

  if (loading || !isLoaded) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          maxHeight: "700px",
          background: "#f8f9fa",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              border: "4px solid #e9ecef",
              borderTop: "4px solid #667eea",
              borderRadius: "50%",
              width: "50px",
              height: "50px",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }}
          ></div>
          <p style={{ color: "#495057", fontSize: "16px", fontWeight: 500 }}>Cargando mapa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          background: "#fff3cd",
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
        <p style={{ color: "#856404", fontWeight: 600, fontSize: "18px", marginBottom: "20px" }}>
          {error}
        </p>
        <button
          onClick={cargarUbicaciones}
          style={{
            padding: "12px 24px",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: 600,
            boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.5)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.3)";
          }}
        >
          🔄 Reintentar
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

  // Calcular tiempo estimado desde última actualización
  const minutosDesdeActualizacion = ubicaciones.repartidor
    ? Math.floor(
        (Date.now() - new Date(ubicaciones.repartidor.actualizado_en).getTime()) / 60000
      )
    : 0;

  // Crear ruta entre restaurante, repartidor y cliente (si están disponibles)
  const pathCoordinates = [];
  if (ubicaciones.restaurante) {
    pathCoordinates.push({
      lat: ubicaciones.restaurante.latitud,
      lng: ubicaciones.restaurante.longitud,
    });
  }
  if (ubicaciones.repartidor) {
    pathCoordinates.push({
      lat: ubicaciones.repartidor.latitud,
      lng: ubicaciones.repartidor.longitud,
    });
  }
  pathCoordinates.push({
    lat: clienteLatActual,
    lng: clienteLngActual,
  });

  // Función para centrar en el repartidor
  const centrarEnRepartidor = () => {
    if (map && ubicaciones.repartidor) {
      map.panTo({
        lat: ubicaciones.repartidor.latitud,
        lng: ubicaciones.repartidor.longitud,
      });
      map.setZoom(16);
      // Recargar ubicaciones
      cargarUbicaciones();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0",
        width: "100%",
        height: "100%",
        position: "relative",
        background: "white",
      }}
    >
      {/* Mapa de Google Maps - Más grande y visible */}
      <div
        style={{
          height: "calc(100vh - 200px)",
          minHeight: "600px",
          width: "100%",
          position: "relative",
          background: "white",
        }}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={14}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: true, // Habilitar control de tipo de mapa (satélite, terreno, etc)
            mapTypeControlOptions: {
              style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
              position: google.maps.ControlPosition.TOP_RIGHT,
              mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
            },
            streetViewControl: true,
            fullscreenControl: true,
            rotateControl: true,
            tilt: 45, // Habilitar vista 3D inclinada
          }}
        >
          {/* Línea de ruta */}
          {pathCoordinates.length > 1 && (
            <Polyline
              path={pathCoordinates}
              options={{
                strokeColor: "#667eea",
                strokeOpacity: 0.8,
                strokeWeight: 5,
                geodesic: true,
              }}
            />
          )}

          {/* Marcador del Restaurante con icono personalizado */}
          {ubicaciones.restaurante && (
            <>
              <Marker
                position={{
                  lat: ubicaciones.restaurante.latitud,
                  lng: ubicaciones.restaurante.longitud,
                }}
                icon={{
                  url: createCustomIcon("🍽️", "#10b981"),
                  scaledSize: new google.maps.Size(50, 65),
                  anchor: new google.maps.Point(25, 65),
                }}
                onClick={() => setSelectedMarker("restaurante")}
              />
              {selectedMarker === "restaurante" && (
                <InfoWindow
                  position={{
                    lat: ubicaciones.restaurante.latitud,
                    lng: ubicaciones.restaurante.longitud,
                  }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div style={{ padding: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "28px", marginBottom: "6px" }}>🍽️</div>
                    <p style={{ fontWeight: 700, margin: "0 0 4px", fontSize: "15px", color: "#1f2937" }}>
                      Restaurante
                    </p>
                    <p style={{ fontSize: "13px", margin: 0, color: "#6b7280" }}>
                      Punto de origen
                    </p>
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {/* Marcador del Repartidor con icono personalizado */}
          {ubicaciones.repartidor && (
            <>
              <Marker
                position={{
                  lat: ubicaciones.repartidor.latitud,
                  lng: ubicaciones.repartidor.longitud,
                }}
                icon={{
                  url: createCustomIcon("🚚", "#3b82f6"),
                  scaledSize: new google.maps.Size(55, 70),
                  anchor: new google.maps.Point(27.5, 70),
                }}
                onClick={() => setSelectedMarker("repartidor")}
                animation={google.maps.Animation.DROP}
              />
              {selectedMarker === "repartidor" && (
                <InfoWindow
                  position={{
                    lat: ubicaciones.repartidor.latitud,
                    lng: ubicaciones.repartidor.longitud,
                  }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div style={{ padding: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "28px", marginBottom: "6px" }}>🚚</div>
                    <p style={{ fontWeight: 700, margin: "0 0 4px", fontSize: "15px", color: "#1f2937" }}>
                      Repartidor
                    </p>
                    {ubicaciones.repartidor.velocidad !== null && ubicaciones.repartidor.velocidad > 0 && (
                      <p style={{ fontSize: "13px", margin: 0, color: "#3b82f6", fontWeight: 600 }}>
                        {ubicaciones.repartidor.velocidad.toFixed(1)} km/h
                      </p>
                    )}
                    <p style={{ fontSize: "12px", margin: "4px 0 0", color: "#6b7280" }}>
                      Actualizado hace {minutosDesdeActualizacion} min
                    </p>
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {/* Marcador del Cliente con icono personalizado */}
          <Marker
            position={{
              lat: clienteLatActual,
              lng: clienteLngActual,
            }}
            icon={{
              url: createCustomIcon("🏠", "#ef4444"),
              scaledSize: new google.maps.Size(50, 65),
              anchor: new google.maps.Point(25, 65),
            }}
            onClick={() => setSelectedMarker("cliente")}
          />
          {selectedMarker === "cliente" && (
            <InfoWindow
              position={{
                lat: clienteLatActual,
                lng: clienteLngActual,
              }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div style={{ padding: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", marginBottom: "6px" }}>🏠</div>
                <p style={{ fontWeight: 700, margin: "0 0 4px", fontSize: "15px", color: "#1f2937" }}>
                  Tu ubicación
                </p>
                <p style={{ fontSize: "13px", margin: 0, color: "#6b7280" }}>
                  Destino de entrega
                </p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Botón flotante para ver ubicación del repartidor */}
        {ubicaciones.repartidor && (
          <button
            onClick={centrarEnRepartidor}
            style={{
              position: "absolute",
              bottom: "20px",
              right: "20px",
              padding: "14px 20px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 600,
              boxShadow: "0 8px 25px rgba(59, 130, 246, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease",
              zIndex: 1000,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-3px) scale(1.05)";
              e.currentTarget.style.boxShadow = "0 12px 35px rgba(59, 130, 246, 0.6)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.4)";
            }}
          >
            <span style={{ fontSize: "20px" }}>📍</span>
            Ver Repartidor
          </button>
        )}
      </div>

      {/* Información de tracking debajo del mapa */}
      {ubicaciones.repartidor && (
        <div
          style={{
            background: "white",
            padding: "20px",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6 0%, #667eea 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
              }}
            >
              🚚
            </div>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1f2937",
                }}
              >
                Tu repartidor está en camino
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#6b7280" }}>
                Ubicación actualizada hace {minutosDesdeActualizacion} min
              </p>
            </div>
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.3)",
                animation: "pulse 2s infinite",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
            }}
          >
            {ubicaciones.repartidor.velocidad !== null && ubicaciones.repartidor.velocidad > 0 && (
              <div
                style={{
                  background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid #93c5fd",
                }}
              >
                <div style={{ fontSize: "20px", marginBottom: "6px" }}>🏃‍♂️</div>
                <p style={{ fontSize: "11px", margin: 0, color: "#1e40af", fontWeight: 600 }}>Velocidad</p>
                <p style={{ fontSize: "20px", fontWeight: 700, margin: "4px 0 0", color: "#1e3a8a" }}>
                  {ubicaciones.repartidor.velocidad.toFixed(1)} <span style={{ fontSize: "12px" }}>km/h</span>
                </p>
              </div>
            )}
            {ubicaciones.repartidor.precision_metros !== null && (
              <div
                style={{
                  background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid #a5b4fc",
                }}
              >
                <div style={{ fontSize: "20px", marginBottom: "6px" }}>🎯</div>
                <p style={{ fontSize: "11px", margin: 0, color: "#4338ca", fontWeight: 600 }}>Precisión</p>
                <p style={{ fontSize: "20px", fontWeight: 700, margin: "4px 0 0", color: "#3730a3" }}>
                  {ubicaciones.repartidor.precision_metros} <span style={{ fontSize: "12px" }}>m</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
