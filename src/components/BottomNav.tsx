import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Fragment, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Dialog, Transition } from "@headlessui/react";

export default function BentoNav() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { logout, usuario } = useAuth();

  const handleAction = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Botón Flotante Circular (FAB) - Esquina Inferior Derecha */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        style={fabButton}
      >
        <motion.div
          animate={isOpen ? "open" : "closed"}
          variants={hamburgerVariants}
          style={hamburgerContainer}
        >
          <motion.span variants={topLineVariants} style={hamburgerLine} />
          <motion.span variants={middleLineVariants} style={hamburgerLine} />
          <motion.span variants={bottomLineVariants} style={hamburgerLine} />
        </motion.div>
      </motion.button>

      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" onClose={() => setIsOpen(false)} style={modalIndex}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div style={backdropStyle} />
          </Transition.Child>

          {/* Panel del Menú Mejorado */}
          <div style={menuPanelWrapper}>
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-400"
              enterFrom="translate-y-full opacity-0"
              enterTo="translate-y-0 opacity-100"
              leave="transform transition ease-in duration-300"
              leaveFrom="translate-y-0 opacity-100"
              leaveTo="translate-y-full opacity-0"
            >
              <Dialog.Panel style={menuPanel}>
                {/* Handle Bar */}
                <div style={handleBar} />

                {/* Header con Usuario */}
                <div style={userSection}>
                  <div style={userAvatar}>
                    {usuario?.email?.[0].toUpperCase()}
                  </div>
                  <div style={userInfo}>
                    <p style={userGreeting}>¡Hola!</p>
                    <h3 style={userNameText}>
                      {usuario?.email?.split("@")[0]}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    style={logoutButton}
                  >
                    <span style={logoutIcon}>🚪</span>
                  </button>
                </div>

                {/* Grid de Navegación Mejorado */}
                <div style={navigationGrid}>
                  {/* Home - Item Grande */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction("/home")}
                    style={navItemLarge}
                  >
                    <div style={navIconLarge}>🏠</div>
                    <div style={navTextContainer}>
                      <span style={navLabelLarge}>Inicio</span>
                      <span style={navSubtitle}>Descubre restaurantes</span>
                    </div>
                    <span style={navArrow}>→</span>
                  </motion.button>

                  {/* Restaurantes */}
                  <motion.button
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAction("/restaurantes")}
                    style={navItemMedium}
                  >
                    <div style={navIconMedium}>🍽️</div>
                    <span style={navLabel}>Restaurantes</span>
                  </motion.button>

                  {/* Pedidos */}
                  <motion.button
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAction("/pedidos")}
                    style={navItemMedium}
                  >
                    <div style={navIconMedium}>📦</div>
                    <span style={navLabel}>Mis Pedidos</span>
                  </motion.button>

                  {/* Carrito */}
                  <motion.button
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAction("/carrito")}
                    style={navItemSmall}
                  >
                    <div style={navIconSmall}>🛒</div>
                    <span style={navLabelSmall}>Carrito</span>
                  </motion.button>

                  {/* Perfil */}
                  <motion.button
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAction("/mi-cuenta")}
                    style={navItemSmall}
                  >
                    <div style={navIconSmall}>👤</div>
                    <span style={navLabelSmall}>Perfil</span>
                  </motion.button>
                </div>

                {/* Footer del Menú */}
                <div style={menuFooter}>
                  <p style={footerText}>Food Delibery Roatan</p>
                  <p style={footerSubtext}>Tu comida, más cerca</p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

// --- Estilos Modernos ---

// FAB Button (Floating Action Button)
const fabButton: React.CSSProperties = {
  position: "fixed",
  bottom: "24px",
  right: "24px",
  width: "64px",
  height: "64px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  border: "none",
  boxShadow:
    "0 8px 32px rgba(79, 70, 229, 0.4), 0 0 0 0 rgba(79, 70, 229, 0.3)",
  cursor: "pointer",
  zIndex: 10003,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "box-shadow 0.3s ease",
};

// Hamburger Menu
const hamburgerContainer: React.CSSProperties = {
  width: "24px",
  height: "18px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  position: "relative",
};

const hamburgerLine: React.CSSProperties = {
  width: "100%",
  height: "2.5px",
  background: "#ffffff",
  borderRadius: "2px",
  transformOrigin: "center",
};

// Animaciones del Hamburger
const hamburgerVariants = {
  open: {},
  closed: {},
};

const topLineVariants = {
  open: { rotate: 45, y: 8 },
  closed: { rotate: 0, y: 0 },
};

const middleLineVariants = {
  open: { opacity: 0 },
  closed: { opacity: 1 },
};

const bottomLineVariants = {
  open: { rotate: -45, y: -8 },
  closed: { rotate: 0, y: 0 },
};

// Modal
const modalIndex: React.CSSProperties = {
  zIndex: 10000,
  position: "fixed",
  inset: 0,
};

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.7)",
  backdropFilter: "blur(12px)",
};

// Menu Panel
const menuPanelWrapper: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  display: "flex",
  justifyContent: "center",
  pointerEvents: "none",
};

const menuPanel: React.CSSProperties = {
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  width: "100%",
  maxWidth: "540px",
  maxHeight: "85vh",
  borderRadius: "32px 32px 0 0",
  padding: "24px 20px 32px",
  boxShadow: "0 -10px 60px rgba(15, 23, 42, 0.2)",
  border: "1px solid rgba(255, 255, 255, 0.8)",
  borderBottom: "none",
  pointerEvents: "auto",
  overflowY: "auto",
};

const handleBar: React.CSSProperties = {
  width: "48px",
  height: "5px",
  background: "linear-gradient(90deg, #e0e7ff 0%, #c7d2fe 100%)",
  borderRadius: "10px",
  margin: "0 auto 24px",
};

// User Section
const userSection: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  padding: "20px",
  background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
  borderRadius: "20px",
  marginBottom: "24px",
  border: "2px solid #c7d2fe",
  boxShadow: "0 4px 16px rgba(79, 70, 229, 0.1)",
};

const userAvatar: React.CSSProperties = {
  width: "56px",
  height: "56px",
  borderRadius: "16px",
  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: 900,
  boxShadow: "0 8px 20px rgba(79, 70, 229, 0.4)",
};

const userInfo: React.CSSProperties = {
  flex: 1,
};

const userGreeting: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#64748b",
  fontWeight: 600,
  marginBottom: "4px",
};

const userNameText: React.CSSProperties = {
  margin: 0,
  fontSize: "20px",
  color: "#1e293b",
  fontWeight: 800,
};

const logoutButton: React.CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "12px",
  background: "#ffffff",
  border: "2px solid #fee2e2",
  color: "#ef4444",
  fontSize: "20px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.3s ease",
  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.1)",
};

const logoutIcon: React.CSSProperties = {
  fontSize: "20px",
};

// Navigation Grid
const navigationGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "16px",
  marginBottom: "24px",
};

// Nav Items Base
const navItemBase: React.CSSProperties = {
  border: "none",
  borderRadius: "20px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.08)",
  position: "relative",
  overflow: "hidden",
};

// Large Nav Item (Home)
const navItemLarge: React.CSSProperties = {
  ...navItemBase,
  gridColumn: "span 2",
  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  padding: "24px",
  justifyContent: "space-between",
  gap: "16px",
};

const navIconLarge: React.CSSProperties = {
  width: "56px",
  height: "56px",
  borderRadius: "16px",
  background: "rgba(255, 255, 255, 0.2)",
  backdropFilter: "blur(10px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  flexShrink: 0,
};

const navTextContainer: React.CSSProperties = {
  flex: 1,
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const navLabelLarge: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 800,
  color: "#ffffff",
  display: "block",
};

const navSubtitle: React.CSSProperties = {
  fontSize: "13px",
  color: "rgba(255, 255, 255, 0.8)",
  fontWeight: 600,
};

const navArrow: React.CSSProperties = {
  fontSize: "24px",
  color: "rgba(255, 255, 255, 0.6)",
  fontWeight: 700,
};

// Medium Nav Items
const navItemMedium: React.CSSProperties = {
  ...navItemBase,
  background: "#ffffff",
  padding: "20px",
  flexDirection: "column",
  gap: "12px",
  alignItems: "flex-start",
};

const navIconMedium: React.CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
};

const navLabel: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 800,
  color: "#1e293b",
};

// Small Nav Items
const navItemSmall: React.CSSProperties = {
  ...navItemBase,
  background: "#ffffff",
  padding: "16px",
  flexDirection: "column",
  gap: "10px",
  alignItems: "center",
  justifyContent: "center",
};

const navIconSmall: React.CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
};

const navLabelSmall: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#1e293b",
};

// Menu Footer
const menuFooter: React.CSSProperties = {
  textAlign: "center",
  paddingTop: "16px",
  borderTop: "2px solid #f1f5f9",
};

const footerText: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  fontWeight: 800,
  color: "#1e293b",
  marginBottom: "4px",
};

const footerSubtext: React.CSSProperties = {
  margin: 0,
  fontSize: "12px",
  color: "#64748b",
  fontWeight: 600,
};
