import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: "info" | "success" | "error" | "warning";
}

export default function InfoModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
}: InfoModalProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          border: "#34d399",
        };
      case "error":
        return {
          bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          border: "#f87171",
        };
      case "warning":
        return {
          bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          border: "#fbbf24",
        };
      default:
        return {
          bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          border: "#60a5fa",
        };
    }
  };

  const colors = getColors();

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        onClose={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 10500 }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(8px)",
            }}
          />
        </Transition.Child>

        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              style={{
                width: "100%",
                maxWidth: "400px",
                background: "#ffffff",
                borderRadius: "24px",
                padding: "0",
                boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
                overflow: "hidden",
              }}
            >
              {/* Header con color según tipo */}
              <div
                style={{
                  background: colors.bg,
                  padding: "24px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "64px",
                    marginBottom: "8px",
                    filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))",
                  }}
                >
                  {getIcon()}
                </div>
                {title && (
                  <Dialog.Title
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#ffffff",
                      margin: 0,
                    }}
                  >
                    {title}
                  </Dialog.Title>
                )}
              </div>

              {/* Contenido */}
              <div style={{ padding: "32px 24px" }}>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#1e293b",
                    margin: "0 0 24px 0",
                    lineHeight: "1.6",
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  {message}
                </p>

                <button
                  onClick={onClose}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    borderRadius: "12px",
                    background: colors.bg,
                    color: "#ffffff",
                    fontSize: "16px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: `0 4px 16px ${colors.border}80`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.boxShadow = `0 6px 20px ${colors.border}99`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = `0 4px 16px ${colors.border}80`;
                  }}
                >
                  Entendido
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
