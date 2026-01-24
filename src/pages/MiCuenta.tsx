import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";

export default function MiCuenta() {
  const navigate = useNavigate();
  const { usuario, setUsuario, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [formData, setFormData] = useState({
    nombre: usuario?.nombre || "",
    telefono: usuario?.telefono || "",
    direccion: usuario?.direccion || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    setSaving(true);
    setMensaje("");

    try {
      const { data, error } = await supabase
        .from("usuarios")
        .update({
          nombre: formData.nombre,
          telefono: formData.telefono,
          direccion: formData.direccion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", usuario.id)
        .select()
        .single();

      if (error) {
        console.error("Error al actualizar:", error);
        setMensaje("Error al actualizar los datos");
      } else if (data) {
        setUsuario(data);
        setMensaje("Datos actualizados correctamente");
        setEditing(false);
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje("Error al actualizar los datos");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!usuario) {
    return null;
  }

  return (
    <div
      style={{ minHeight: "100vh", background: "#fafafa", paddingBottom: 80 }}
    >
      <Header />

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "24px 20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {usuario.nombre.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {usuario.nombre}
              </h1>
              <p
                style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: 14 }}
              >
                {usuario.email}
              </p>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 8,
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: "#dbeafe",
                  color: "#1e40af",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {usuario.tipo_usuario === "cliente"
                  ? "Cliente"
                  : usuario.tipo_usuario}
              </span>
            </div>
          </div>

          {mensaje && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: mensaje.includes("Error") ? "#fee2e2" : "#d1fae5",
                color: mensaje.includes("Error") ? "#991b1b" : "#065f46",
                marginBottom: 20,
                fontSize: 14,
              }}
            >
              {mensaje}
            </div>
          )}

          {!editing ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <h3
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#374151",
                  }}
                >
                  Información Personal
                </h3>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      Nombre
                    </label>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: 15,
                        color: "#0f172a",
                      }}
                    >
                      {usuario.nombre}
                    </p>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      Teléfono
                    </label>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: 15,
                        color: "#0f172a",
                      }}
                    >
                      {usuario.telefono || "No especificado"}
                    </p>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      Dirección
                    </label>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: 15,
                        color: "#0f172a",
                      }}
                    >
                      {usuario.direccion || "No especificada"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setEditing(true)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#4f46e5",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginBottom: 12,
                }}
              >
                Editar información
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div>
                  <label
                    htmlFor="nombre"
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: "#6b7280",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      fontSize: 15,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="telefono"
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: "#6b7280",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      fontSize: 15,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="direccion"
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: "#6b7280",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Dirección
                  </label>
                  <textarea
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      fontSize: 15,
                      outline: "none",
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      nombre: usuario?.nombre || "",
                      telefono: usuario?.telefono || "",
                      direccion: usuario?.direccion || "",
                    });
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "#374151",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "none",
                    background: saving ? "#9ca3af" : "#059669",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          )}
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 10,
            border: "none",
            background: "#dc2626",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </main>
    </div>
  );
}
