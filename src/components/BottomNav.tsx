import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

type NavItem = {
  label: string;
  icon: string;
  path: string;
  match: (pathname: string) => boolean;
  badgeKey?: "pedidos" | "carrito";
};

const navItems: NavItem[] = [
  {
    label: "Inicio",
    icon: "🏠",
    path: "/home",
    match: (pathname) => pathname === "/home",
  },
  {
    label: "Restaurantes",
    icon: "🍽️",
    path: "/restaurantes",
    match: (pathname) =>
      pathname.startsWith("/restaurantes") ||
      pathname.startsWith("/restaurante/"),
  },
  {
    label: "Pedidos",
    icon: "📦",
    path: "/pedidos",
    match: (pathname) =>
      pathname.startsWith("/pedidos") || pathname.startsWith("/pedido/"),
    badgeKey: "pedidos",
  },
  {
    label: "Carrito",
    icon: "🛒",
    path: "/carrito",
    match: (pathname) => pathname.startsWith("/carrito"),
    badgeKey: "carrito",
  },
  {
    label: "Perfil",
    icon: "👤",
    path: "/mi-cuenta",
    match: (pathname) => pathname.startsWith("/mi-cuenta"),
  },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [pedidosCount, setPedidosCount] = useState(0);

  useEffect(() => {
    if (!usuario?.id) {
      setCartCount(0);
      return;
    }

    const cargarConteoCarrito = async () => {
      try {
        const { data, error } = await supabase
          .from("carrito")
          .select("cantidad")
          .eq("usuario_id", usuario.id);

        if (error) throw error;

        const totalItems = (data || []).reduce(
          (acc: number, item: any) => acc + Number(item.cantidad || 0),
          0,
        );

        setCartCount(totalItems);
      } catch (error) {
        console.error("Error al cargar conteo del carrito:", error);
        setCartCount(0);
      }
    };

    cargarConteoCarrito();

    const channel = supabase
      .channel(`bottom-nav-cart-${usuario.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "carrito",
          filter: `usuario_id=eq.${usuario.id}`,
        },
        () => {
          cargarConteoCarrito();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuario?.id]);

  useEffect(() => {
    if (!usuario?.id) {
      setPedidosCount(0);
      return;
    }

    const estadosActivos = [
      "pendiente",
      "confirmado",
      "en_preparacion",
      "listo",
      "en_camino",
    ];

    const cargarConteoPedidos = async () => {
      try {
        const { data, error } = await supabase
          .from("vista_pedidos_cliente")
          .select("pedido_id")
          .eq("usuario_id", usuario.id)
          .in("estado", estadosActivos);

        if (error) throw error;
        setPedidosCount((data || []).length);
      } catch (error) {
        console.error("Error al cargar conteo de pedidos:", error);
        setPedidosCount(0);
      }
    };

    cargarConteoPedidos();

    const channel = supabase
      .channel(`bottom-nav-pedidos-${usuario.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: `usuario_id=eq.${usuario.id}`,
        },
        () => {
          cargarConteoPedidos();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuario?.id]);

  const badgeCounts = useMemo(() => {
    const toBadgeText = (value: number) => {
      if (value < 1) return null;
      if (value > 99) return "99+";
      return String(value);
    };

    return {
      carrito: toBadgeText(cartCount),
      pedidos: toBadgeText(pedidosCount),
    };
  }, [cartCount, pedidosCount]);

  return (
    <nav style={wrapperStyle} aria-label="Navegación principal">
      <div style={barStyle}>
        {navItems.map((item) => {
          const active = item.match(location.pathname);

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.94 }}
              style={{
                ...itemStyle,
                ...(active ? itemStyleActive : null),
              }}
              aria-current={active ? "page" : undefined}
            >
              <span style={iconWrapStyle}>
                <span
                  style={{ ...iconStyle, ...(active ? iconActiveStyle : null) }}
                >
                  {item.icon}
                </span>
                {item.badgeKey && badgeCounts[item.badgeKey] && (
                  <span style={badgeStyle}>{badgeCounts[item.badgeKey]}</span>
                )}
              </span>
              <span
                style={{ ...labelStyle, ...(active ? labelActiveStyle : null) }}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

const wrapperStyle: React.CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 10020,
  padding: "0 12px calc(env(safe-area-inset-bottom) + 10px)",
  pointerEvents: "none",
};

const barStyle: React.CSSProperties = {
  pointerEvents: "auto",
  margin: "0 auto",
  maxWidth: "860px",
  background: "rgba(255, 255, 255, 0.96)",
  backdropFilter: "blur(10px)",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.16)",
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "6px",
  padding: "8px",
};

const itemStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  borderRadius: "12px",
  height: "84px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const itemStyleActive: React.CSSProperties = {
  background: "#eef2ff",
};

const iconWrapStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-flex",
};

const iconStyle: React.CSSProperties = {
  fontSize: "20px",
  lineHeight: 1,
  filter: "grayscale(0.2)",
};

const iconActiveStyle: React.CSSProperties = {
  filter: "none",
};

const badgeStyle: React.CSSProperties = {
  position: "absolute",
  top: "-10px",
  right: "-16px",
  minWidth: "22px",
  height: "22px",
  borderRadius: "9999px",
  padding: "0 7px",
  background: "#ef4444",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 800,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2.5px solid #ffffff",
  boxShadow: "0 4px 10px rgba(239, 68, 68, 0.45)",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#64748b",
  letterSpacing: "0.1px",
};

const labelActiveStyle: React.CSSProperties = {
  color: "#4338ca",
};
