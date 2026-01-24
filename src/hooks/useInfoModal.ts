import { useState } from "react";

interface InfoModalState {
  isOpen: boolean;
  title?: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

export function useInfoModal() {
  const [modalState, setModalState] = useState<InfoModalState>({
    isOpen: false,
    message: "",
    type: "info",
  });

  const showInfo = (message: string, title?: string) => {
    setModalState({
      isOpen: true,
      message,
      title,
      type: "info",
    });
  };

  const showSuccess = (message: string, title?: string) => {
    setModalState({
      isOpen: true,
      message,
      title: title || "¡Éxito!",
      type: "success",
    });
  };

  const showError = (message: string, title?: string) => {
    setModalState({
      isOpen: true,
      message,
      title: title || "Error",
      type: "error",
    });
  };

  const showWarning = (message: string, title?: string) => {
    setModalState({
      isOpen: true,
      message,
      title: title || "Atención",
      type: "warning",
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    modalState,
    showInfo,
    showSuccess,
    showError,
    showWarning,
    closeModal,
  };
}
