import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Inicio", icon: "🏠", path: "/home" },
    { label: "Restaurantes", icon: "🍽️", path: "/restaurantes" },
    { label: "Carrito", icon: "🛒", path: "/carrito" },
    { label: "Pedidos", icon: "📦", path: "/pedidos" },
    { label: "Mi Cuenta", icon: "👤", path: "/mi-cuenta" },
  ];

  const [selectedIndex, setSelectedIndex] = useState(() => {
    const idx = navItems.findIndex((i) => i.path === location.pathname);
    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    const idx = navItems.findIndex((i) => i.path === location.pathname);
    if (idx >= 0) setSelectedIndex(idx);
  }, [location.pathname]);

  const handleMenuItemClick = (path: string, idx: number) => {
    setSelectedIndex(idx);
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Botón hamburguesa flotante */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={styles.hamburgerButton as any}
      >
        <motion.div
          animate={{
            rotate: isMenuOpen ? 45 : 0,
            y: isMenuOpen ? 8 : 0,
          }}
          transition={{ duration: 0.3 }}
          style={styles.hamburgerLine as any}
        />
        <motion.div
          animate={{
            opacity: isMenuOpen ? 0 : 1,
          }}
          transition={{ duration: 0.2 }}
          style={styles.hamburgerLine as any}
        />
        <motion.div
          animate={{
            rotate: isMenuOpen ? -45 : 0,
            y: isMenuOpen ? -8 : 0,
          }}
          transition={{ duration: 0.3 }}
          style={styles.hamburgerLine as any}
        />
      </motion.button>

      {/* Overlay oscuro cuando el menú está abierto */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            style={styles.overlay as any}
          />
        )}
      </AnimatePresence>

      {/* Menú desplegable */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={styles.menuContainer as any}
          >
            <div style={styles.menuHeader as any}>
              <h2 style={styles.menuTitle as any}>Menú</h2>
            </div>

            <div style={styles.menuItems as any}>
              {navItems.map((item, idx) => (
                <motion.button
                  key={item.path}
                  onClick={() => handleMenuItemClick(item.path, idx)}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    ...styles.menuItem,
                    background:
                      location.pathname === item.path
                        ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                        : "transparent",
                    color: location.pathname === item.path ? "#fff" : "#1f2937",
                  } as any}
                >
                  <span style={styles.menuItemIcon as any}>{item.icon}</span>
                  <span style={styles.menuItemLabel as any}>{item.label}</span>
                  {location.pathname === item.path && (
                    <motion.div
                      layoutId="activeIndicator"
                      style={styles.activeIndicator as any}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
const styles = {
  hamburgerButton: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    zIndex: 1000,
    boxShadow: "0 8px 24px rgba(79, 70, 229, 0.4)",
  },
  hamburgerLine: {
    width: "24px",
    height: "3px",
    backgroundColor: "#fff",
    borderRadius: "2px",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 998,
  },
  menuContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    width: "280px",
    maxWidth: "80vw",
    backgroundColor: "#ffffff",
    boxShadow: "4px 0 24px rgba(0, 0, 0, 0.15)",
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
  },
  menuHeader: {
    padding: "24px 20px",
    borderBottom: "1px solid #e5e7eb",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  },
  menuTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 700,
    color: "#fff",
  },
  menuItems: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    overflowY: "auto",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px 20px",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 500,
    transition: "all 0.2s ease",
    position: "relative",
    textAlign: "left",
  },
  menuItemIcon: {
    fontSize: "24px",
  },
  menuItemLabel: {
    flex: 1,
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
    width: "4px",
    height: "24px",
    backgroundColor: "#fff",
    borderRadius: "0 4px 4px 0",
  },
};
