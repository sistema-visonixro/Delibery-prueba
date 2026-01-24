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
      {/* Botón Flotante Estilo Cápsula */}
      <div style={dockContainer}>
        <motion.button
          layoutId="nav-pill"
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          style={mainButtonStyle}
        >
          <div style={burgerWrapper}>
            <span style={dotStyle} />
            <span style={dotStyle} />
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: "13px",
              letterSpacing: "0.5px",
            }}
          >
            Menu
          </span>
        </motion.button>
      </div>

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

          {/* Sheet desde arriba */}
          <div style={sheetWrapperTop}>
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-400"
              enterFrom="-translate-y-full"
              enterTo="translate-y-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-y-0"
              leaveTo="-translate-y-full"
            >
              <Dialog.Panel style={bentoSheetTop}>
                {/* Pull Indicator */}
                <div style={handleBar} />

                {/* User Profile Glass Card */}
                <div style={userCardTop}>
                  <div style={avatarHex}>
                    {usuario?.email?.[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={userWelcome}>Hola,</p>
                    <h4 style={userName}>{usuario?.email?.split("@")[0]}</h4>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    style={exitBtn}
                  >
                    Cerrar Sesión
                  </button>
                </div>

                {/* Bento Grid 2.0 */}
                <div style={bentoGridTop}>
                  {/* Item Grande: Home */}
                  <button
                    onClick={() => handleAction("/home")}
                    style={{
                      ...gridItemTopAccent,
                      gridColumn: "span 2",
                    }}
                  >
                    <div style={iconBoxDark}>🏠</div>
                    <div>
                      <span style={{ ...gridLabel, color: "#fff" }}>
                        Inicio
                      </span>
                    </div>
                  </button>

                  {/* Items Medianos */}
                  <button
                    onClick={() => handleAction("/restaurantes")}
                    style={{
                      ...gridItemTop,
                      border: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <span style={iconCircleTop}>🍽️</span>
                    <span style={gridLabel}>Locales</span>
                  </button>

                  <button
                    onClick={() => handleAction("/comidas")}
                    style={{
                      ...gridItemTop,
                      border: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <span style={iconCircleTop}>🍛</span>
                    <span style={gridLabel}>Menú</span>
                  </button>

                  {/* Item Largo: Pedidos */}
                  <button
                    onClick={() => handleAction("/pedidos")}
                    style={{
                      ...gridItemTop,
                      gridColumn: "span 2",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                      }}
                    >
                      <span style={iconCircleTop}>📦</span>
                      <div style={{ textAlign: "left" }}>
                        <span style={gridLabel}>Mis Pedidos</span>
                        <p style={gridSub}>Rastreo en tiempo real</p>
                      </div>
                    </div>
                    <span style={arrowIcon}>→</span>
                  </button>

                  {/* Items Pequeños Finales */}
                  <button
                    onClick={() => handleAction("/carrito")}
                    style={{
                      ...gridItemTop,
                      background: "#f0fdf4",
                      border: "1px solid #dcfce7",
                    }}
                  >
                    <span style={iconCircleTop}>🛒</span>
                    <span style={gridLabel}>Carrito</span>
                  </button>

                  <button
                    onClick={() => handleAction("/mi-cuenta")}
                    style={{
                      ...gridItemTop,
                      background: "#fff",
                      border: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <span style={iconCircleTop}>👤</span>
                    <span style={gridLabel}>Perfil</span>
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

// --- Estilos Rediseñados ---

const modalIndex: React.CSSProperties = {
  zIndex: 2000,
  position: "fixed",
  inset: 0,
};

const dockContainer: React.CSSProperties = {
  position: "fixed",
  bottom: "30px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 10002,
};

const mainButtonStyle: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  border: "none",
  padding: "14px 28px",
  borderRadius: "100px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  boxShadow: "0 15px 30px -5px rgba(15, 23, 42, 0.4)",
  cursor: "pointer",
};

// Asegurar que el botón reciba eventos por encima de overlays
mainButtonStyle.zIndex = 10003;
mainButtonStyle.pointerEvents = "auto" as any;

const burgerWrapper: React.CSSProperties = { display: "flex", gap: "4px" };
const dotStyle: React.CSSProperties = {
  width: "6px",
  height: "6px",
  background: "#6366f1",
  borderRadius: "50%",
};

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(8px)",
};

// Wrapper para sheet que cae desde arriba
const sheetWrapperTop: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  display: "flex",
  justifyContent: "center",
  pointerEvents: "none",
};

const bentoSheetTop: React.CSSProperties = {
  background: "linear-gradient(180deg,#ffffff,#f8fafc)",
  width: "100%",
  maxWidth: "520px",
  maxHeight: "80vh",
  borderRadius: "0 0 24px 24px",
  padding: "18px 18px 28px",
  boxShadow: "0 20px 50px rgba(2,6,23,0.12)",
  border: "1px solid rgba(0,0,0,0.04)",
  pointerEvents: "auto",
};

const handleBar: React.CSSProperties = {
  width: "40px",
  height: "4px",
  background: "#e2e8f0",
  borderRadius: "10px",
  margin: "0 auto 18px",
};

const userCardTop: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "14px 16px",
  background: "linear-gradient(90deg,#eef2ff,#fff)",
  borderRadius: "12px",
  marginBottom: "14px",
  border: "1px solid rgba(0,0,0,0.03)",
};

const avatarHex: React.CSSProperties = {
  width: "42px",
  height: "42px",
  background: "linear-gradient(135deg, #6366f1, #a855f7)",
  borderRadius: "14px",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  fontSize: "18px",
  boxShadow: "0 8px 15px rgba(99, 102, 241, 0.3)",
};

const userWelcome: React.CSSProperties = {
  margin: 0,
  fontSize: "11px",
  color: "#64748b",
  fontWeight: 600,
};
const userName: React.CSSProperties = {
  margin: 0,
  fontSize: "16px",
  color: "#1e293b",
  fontWeight: 800,
};

const exitBtn: React.CSSProperties = {
  background: "white",
  border: "1px solid #fee2e2",
  color: "#ef4444",
  padding: "6px 10px",
  borderRadius: "10px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const bentoGridTop: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const gridItemTopBase: React.CSSProperties = {
  border: "none",
  borderRadius: "14px",
  padding: "16px",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  transition: "transform 0.18s ease, box-shadow 0.18s ease",
  boxShadow: "0 6px 20px rgba(2,6,23,0.04)",
};

const gridItemTop: React.CSSProperties = {
  ...gridItemTopBase,
  background: "#ffffff",
};

const gridItemTopAccent: React.CSSProperties = {
  ...gridItemTopBase,
  background: "linear-gradient(90deg,#6366f1,#a855f7)",
  color: "white",
};

const iconCircleTop: React.CSSProperties = {
  width: "40px",
  height: "40px",
  background: "#f1f5f9",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
};

const iconBoxDark: React.CSSProperties = {
  width: "40px",
  height: "40px",
  background: "rgba(0,0,0,0.06)",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  color: "white",
};

const gridLabel: React.CSSProperties = {
  fontWeight: 800,
  fontSize: "14px",
  color: "#0f172a",
};
const gridSub: React.CSSProperties = {
  margin: 0,
  fontSize: "10px",
  opacity: 0.7,
  fontWeight: 500,
};
const arrowIcon: React.CSSProperties = {
  fontSize: "16px",
  opacity: 0.3,
  fontWeight: "bold",
};
