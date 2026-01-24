import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import BackButton from "../components/BackButton";

interface Platillo {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  precio: number;
  disponible: boolean;
  restaurante_id: string;
  restaurantes?: { id: string; nombre: string } | null;
}

interface Bebida {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  precio: number;
  tamano?: string;
  temperatura?: string;
  disponible: boolean;
  restaurante_id: string;
  restaurantes?: { id: string; nombre: string } | null;
}

export default function Categoria() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState<string | null>(null);
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [bebidas, setBebidas] = useState<Bebida[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function cargar() {
      setLoading(true);
      try {
        const { data: cat } = await supabase
          .from("categorias")
          .select("nombre")
          .eq("id", id)
          .single();
        if (cat) setNombre(cat.nombre || null);

        const { data: plats, error: errP } = await supabase
          .from("platillos")
          .select(
            "id,nombre,descripcion,imagen_url,precio,disponible,restaurante_id,restaurantes(id,nombre)",
          )
          .eq("categoria_id", id)
          .order("nombre", { ascending: true });

        if (errP) {
          console.error("Error platillos:", errP);
          setPlatillos([]);
        } else {
          setPlatillos(
            (plats || []).map((p: any) => ({
              id: p.id,
              nombre: p.nombre,
              descripcion: p.descripcion,
              imagen_url: p.imagen_url,
              precio: p.precio,
              disponible: p.disponible,
              restaurante_id: p.restaurante_id,
              restaurantes: p.restaurantes
                ? { id: p.restaurantes.id, nombre: p.restaurantes.nombre }
                : null,
            })),
          );
        }

        const { data: bebs, error: errB } = await supabase
          .from("bebidas")
          .select(
            "id,nombre,descripcion,imagen_url,precio,tamano,temperatura,disponible,restaurante_id,restaurantes(id,nombre)",
          )
          .eq("categoria_id", id)
          .order("nombre", { ascending: true });

        if (errB) {
          console.error("Error bebidas:", errB);
          setBebidas([]);
        } else {
          setBebidas(
            (bebs || []).map((b: any) => ({
              id: b.id,
              nombre: b.nombre,
              descripcion: b.descripcion,
              imagen_url: b.imagen_url,
              precio: b.precio,
              tamano: b.tamano,
              temperatura: b.temperatura,
              disponible: b.disponible,
              restaurante_id: b.restaurante_id,
              restaurantes: b.restaurantes
                ? { id: b.restaurantes.id, nombre: b.restaurantes.nombre }
                : null,
            })),
          );
        }
      } catch (err) {
        console.error(err);
        setPlatillos([]);
        setBebidas([]);
      } finally {
        setLoading(false);
      }
    }

    cargar();
  }, [id]);

  return (
    <div
      style={{ minHeight: "100vh", background: "#fafafa", paddingBottom: 80 }}
    >
      {/* Header */}
      <header
        style={{
          background: "#fff",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <BackButton
          onClick={() => navigate(-1)}
          style={{ position: "relative", top: 0, left: 0 }}
        />

        <h2
          style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}
        >
          {nombre ?? "Categoría"}
        </h2>
      </header>

      <main style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 48 }}>⏳</div>
            <p style={{ color: "#6b7280", marginTop: 12 }}>Cargando...</p>
          </div>
        ) : (
          <>
            <section style={{ marginBottom: 16 }}>
              <h3 style={{ margin: "8px 0" }}>Platillos</h3>
              {platillos.length === 0 ? (
                <p>No hay platillos en esta categoría.</p>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {platillos.map((p) => (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/platillo/${p.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          navigate(`/platillo/${p.id}`);
                      }}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        background: "#fff",
                        borderRadius: 12,
                        padding: 12,
                        boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: 84,
                          height: 84,
                          borderRadius: 8,
                          overflow: "hidden",
                          flex: "0 0 84px",
                        }}
                      >
                        <img
                          src={p.imagen_url || "/placeholder.png"}
                          alt={p.nombre}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <h4 style={{ fontSize: 15, margin: 0 }}>
                            {p.nombre}
                          </h4>
                          <div style={{ fontWeight: 700 }}>
                            ${p.precio.toFixed(2)}
                          </div>
                        </div>
                        <p
                          style={{
                            margin: "6px 0 0 0",
                            color: "#6b7280",
                            fontSize: 13,
                          }}
                        >
                          {p.descripcion}
                        </p>
                        {p.restaurantes && (
                          <p
                            style={{
                              margin: "6px 0 0 0",
                              fontSize: 12,
                              color: "#374151",
                            }}
                          >
                            En: {p.restaurantes.nombre}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 style={{ margin: "8px 0" }}>Bebidas</h3>
              {bebidas.length === 0 ? (
                <p>No hay bebidas en esta categoría.</p>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {bebidas.map((b) => (
                    <div
                      key={b.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/platillo/${b.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          navigate(`/platillo/${b.id}`);
                      }}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        background: "#fff",
                        borderRadius: 12,
                        padding: 12,
                        boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: 84,
                          height: 84,
                          borderRadius: 8,
                          overflow: "hidden",
                          flex: "0 0 84px",
                        }}
                      >
                        <img
                          src={b.imagen_url || "/placeholder.png"}
                          alt={b.nombre}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <h4 style={{ fontSize: 15, margin: 0 }}>
                            {b.nombre}
                          </h4>
                          <div style={{ fontWeight: 700 }}>
                            ${b.precio.toFixed(2)}
                          </div>
                        </div>
                        <p
                          style={{
                            margin: "6px 0 0 0",
                            color: "#6b7280",
                            fontSize: 13,
                          }}
                        >
                          {b.descripcion}
                        </p>
                        {b.tamano && (
                          <p
                            style={{
                              margin: "6px 0 0 0",
                              fontSize: 12,
                              color: "#374151",
                            }}
                          >
                            Tamaño: {b.tamano} • {b.temperatura}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
