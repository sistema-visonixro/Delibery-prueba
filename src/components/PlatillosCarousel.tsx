import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface Platillo {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  precio?: number;
  restaurante_id?: string;
  restaurante?: { id: string; nombre: string } | null;
}

interface Props {
  platillos: Platillo[];
}

export default function PlatillosCarousel({ platillos }: Props) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll || platillos.length === 0) return;

    let animationId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5; // píxeles por frame

    const animate = () => {
      if (!scroll) return;

      scrollPosition += scrollSpeed;

      // Cuando llegamos al final del primer conjunto, reiniciamos
      const maxScroll = scroll.scrollWidth / 2;
      if (scrollPosition >= maxScroll) {
        scrollPosition = 0;
      }

      scroll.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    // Pausar al hover
    const handleMouseEnter = () => cancelAnimationFrame(animationId);
    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(animate);
    };

    scroll.addEventListener("mouseenter", handleMouseEnter);
    scroll.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      scroll.removeEventListener("mouseenter", handleMouseEnter);
      scroll.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [platillos]);

  if (platillos.length === 0) return null;

  // Duplicamos los platillos para efecto infinito
  const duplicatedPlatillos = [...platillos, ...platillos];

  return (
    <div style={{ marginBottom: 20, overflow: "hidden" }}>
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: 10,
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`.hide-scrollbar::-webkit-scrollbar{display:none;}`}</style>
        {duplicatedPlatillos.map((platillo, idx) => (
          <div
            key={`${platillo.id}-${idx}`}
            onClick={() => {
              navigate(`/platillo/${platillo.id}`);
            }}
            style={{
              minWidth: 130,
              flex: "0 0 130px",
              borderRadius: 10,
              overflow: "hidden",
              background: "#fff",
              border: "1px solid rgba(15,23,42,0.08)",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <div
              style={{
                height: 90,
                backgroundImage: `url(${
                  platillo.imagen_url ||
                  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200"
                })`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div style={{ padding: "8px 10px" }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#0f172a",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {platillo.nombre}
              </h4>
              {platillo.precio && (
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#059669",
                  }}
                >
                  L {platillo.precio.toFixed(2)}
                </p>
              )}
              {platillo.restaurante && (
                <p
                  style={{
                    margin: "2px 0 0 0",
                    fontSize: 10,
                    color: "#6b7280",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {platillo.restaurante.nombre}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
