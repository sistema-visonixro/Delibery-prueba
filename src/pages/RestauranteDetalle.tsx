import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import SuccessToast from "../components/SuccessToast";
import ConfirmModal from "../components/ConfirmModal";
import BackButton from "../components/BackButton";

// --- Interfaces ---
interface Restaurante {
  id: string;
  nombre: string;
  descripcion: string;
  imagen_url: string;
  calificacion: number;
  tiempo_entrega_min: number;
  costo_envio: number;
}

interface Platillo {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  precio: number;
  disponible: boolean;
}

export default function RestauranteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPlatillo, setPendingPlatillo] = useState<Platillo | null>(null);

  useEffect(() => {
    if (id) cargarDatos();
  }, [id]);

  async function cargarDatos() {
    setLoading(true);
    try {
      const { data: restData } = await supabase
        .from("restaurantes")
        .select("*")
        .eq("id", id)
        .single();
      setRestaurante(restData);

      const { data: platData } = await supabase
        .from("platillos")
        .select("*")
        .eq("restaurante_id", id)
        .eq("disponible", true)
        .order("nombre");

      setPlatillos(platData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const agregarAlCarrito = async (e: React.MouseEvent, platillo: Platillo) => {
    e.stopPropagation();
    if (!usuario) {
      navigate("/login");
      return;
    }

    setIsAdding(platillo.id);
    try {
      const userId = (usuario as any).id;
      const restauranteId = id;

      // Verificar si el carrito tiene items de otro restaurante
      if (restauranteId) {
        const { data: conflict, error: conflictErr } = await supabase
          .from("carrito")
          .select("id,restaurante_id")
          .eq("usuario_id", userId)
          .neq("restaurante_id", restauranteId)
          .limit(1)
          .maybeSingle();

        if (conflictErr) throw conflictErr;

        if (conflict) {
          // Mostrar modal de confirmación en vez de window.confirm
          setPendingPlatillo(platillo);
          setShowConfirm(true);
          setIsAdding(null);
          return;
        }
      }
      await doAdd(platillo);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(null);
    }
  };

  async function doAdd(platillo: Platillo) {
    if (!usuario) return;
    try {
      const userId = (usuario as any).id;
      const { data: existing } = await supabase
        .from("carrito")
        .select("id, cantidad")
        .eq("usuario_id", userId)
        .eq("platillo_id", platillo.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("carrito")
          .update({ cantidad: existing.cantidad + 1 })
          .eq("id", existing.id);
      } else {
        await supabase.from("carrito").insert({
          usuario_id: userId,
          platillo_id: platillo.id,
          restaurante_id: id,
          cantidad: 1,
          precio_unitario: platillo.precio,
        });
      }
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async function handleConfirmClearAndAdd() {
    setShowConfirm(false);
    if (!pendingPlatillo) return;
    setIsAdding(pendingPlatillo.id);
    try {
      const userId = (usuario as any).id;
      const { error: delErr } = await supabase
        .from("carrito")
        .delete()
        .eq("usuario_id", userId);
      if (delErr) throw delErr;
      await doAdd(pendingPlatillo);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(null);
      setPendingPlatillo(null);
    }
  }

  if (loading) return <Loader />;
  if (!restaurante) return <NotFound navigate={navigate} />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        paddingBottom: "100px",
      }}
    >
      {/* Hero Section Moderno */}
      <div style={heroContainer}>
        <div
          style={{
            ...heroImage,
            backgroundImage: `url(${restaurante.imagen_url})`,
          }}
        />
        <div style={heroOverlay} />

        <BackButton
          onClick={() => navigate(-1)}
          style={{ top: 25, left: 20 }}
        />

        <div style={heroContent}>
          <div style={headerBadge}>Populares hoy</div>
          <h1 style={{ ...titleStyle, color: "#ffffff" }}>
            {restaurante.nombre}
          </h1>

          <div style={metaRow}> </div>
        </div>
      </div>

      {/* Grid de Menú: Sistema de "Bento Tiles" */}
      <main style={mainContent}>
        <div style={sectionHeader}>
          <h2 style={{ fontSize: "22px", fontWeight: 800 }}>Nuestro Menú</h2>
          <span style={{ color: "#000000ff", fontSize: "14px" }}>
            {platillos.length} opciones
          </span>
        </div>

        <div style={bentoGrid}>
          {platillos.map((p) => (
            <div
              key={p.id}
              style={tileStyle}
              onClick={() => navigate(`/platillo/${p.id}`)}
            >
              <div style={tileImageContainer}>
                <img
                  src={p.imagen_url || "/placeholder.png"}
                  alt={p.nombre}
                  style={tileImage}
                />
                <div style={priceTag}>L {p.precio.toFixed(2)}</div>
              </div>

              <div style={tileBody}>
                <h3 style={tileTitle}>{p.nombre}</h3>
                <p style={tileDesc}>{p.descripcion}</p>

                <button
                  disabled={isAdding === p.id}
                  onClick={(e) => agregarAlCarrito(e, p)}
                  style={{
                    ...addBtnStyle,
                    background: isAdding === p.id ? "#ecfdf5" : "#10b981",
                    color: isAdding === p.id ? "#10b981" : "#fff",
                  }}
                >
                  {isAdding === p.id ? "..." : "+ Añadir"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <ConfirmModal
        visible={showConfirm}
        title="Carrito contiene items de otro restaurante"
        description="Tu carrito contiene productos de otro restaurante. ¿Deseas vaciar el carrito y agregar este platillo?"
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirmClearAndAdd}
        confirmLabel="Vaciar y agregar"
        cancelLabel="Cancelar"
      />

      <SuccessToast
        visible={showSuccess}
        message="Añadido al carrito"
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}

// --- Estilos ---

const heroContainer: React.CSSProperties = {
  position: "relative",
  height: "40vh",
  width: "100%",
  overflow: "hidden",
  display: "flex",
  alignItems: "flex-end",
};

const heroImage: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundSize: "cover",
  backgroundPosition: "center",
  transform: "scale(1.1)",
};

const heroOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)",
};

const heroContent: React.CSSProperties = {
  position: "relative",
  padding: "30px",
  color: "white",
  width: "100%",
};

const headerBadge: React.CSSProperties = {
  background: "#fbbf24",
  color: "#000",
  padding: "4px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase",
  width: "fit-content",
  marginBottom: "10px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: 900,
  margin: "0 0 8px 0",
  letterSpacing: "-1px",
};

const metaRow: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  fontSize: "14px",
  fontWeight: 500,
  opacity: 0.9,
};

/* backBtn removed; using BackButton component for consistent styling */

const mainContent: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "40px 20px",
};

const sectionHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  marginBottom: "30px",
  borderBottom: "2px solid #f8fafc",
  paddingBottom: "15px",
};

const bentoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "25px",
};

const tileStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "24px",
  overflow: "hidden",
  border: "1px solid #f1f5f9",
  cursor: "pointer",
  transition: "all 0.3s ease",
  display: "flex",
  flexDirection: "column",
};

const tileImageContainer: React.CSSProperties = {
  position: "relative",
  height: "200px",
};

const tileImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const priceTag: React.CSSProperties = {
  position: "absolute",
  bottom: "12px",
  right: "12px",
  background: "white",
  padding: "6px 12px",
  borderRadius: "12px",
  fontWeight: 800,
  color: "#10b981",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const tileBody: React.CSSProperties = {
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  flex: 1,
};

const tileTitle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 800,
  margin: "0 0 8px 0",
  color: "#1e293b",
};

const tileDesc: React.CSSProperties = {
  fontSize: "13px",
  color: "#64748b",
  margin: "0 0 20px 0",
  lineHeight: "1.5",
  flex: 1,
};

const addBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "14px",
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
  transition: "0.2s",
};

function Loader() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "3px solid #f3f3f3",
          borderTop: "3px solid #10b981",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function NotFound({ navigate }: { navigate: any }) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h2 style={{ fontWeight: 800 }}>Restaurante no disponible</h2>
      <button
        onClick={() => navigate("/restaurantes")}
        style={{
          marginTop: "20px",
          padding: "12px 24px",
          borderRadius: "12px",
          border: "none",
          background: "#000",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Explorar otros
      </button>
    </div>
  );
}
