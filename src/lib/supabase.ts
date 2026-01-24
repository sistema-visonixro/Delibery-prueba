import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jqhiubituqmwouaszjpc.supabase.co";
const supabaseAnonKey = "sb_publishable_yk9cpugGvHpx_0Ys8hKEsw_h8NH14CR";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  telefono?: string;
  direccion?: string;
  tipo_usuario: "cliente" | "repartidor" | "restaurante" | "operador" | "admin";
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export const loginUsuario = async (
  email: string,
  password: string,
): Promise<Usuario | null> => {
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .eq("activo", true)
      .single();

    if (error || !data) {
      console.error("Error al iniciar sesión:", error);
      return null;
    }

    return data as Usuario;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return null;
  }
};

export const registrarUsuario = async (
  email: string,
  password: string,
  nombre: string,
  telefono?: string,
  direccion?: string,
): Promise<{ success: boolean; message: string; usuario?: Usuario }> => {
  try {
    // Verificar si el email ya existe
    const { data: existingUser } = await supabase
      .from("usuarios")
      .select("email")
      .eq("email", email)
      .single();

    if (existingUser) {
      return { success: false, message: "Este email ya está registrado" };
    }

    // Crear el nuevo usuario
    const { data, error } = await supabase
      .from("usuarios")
      .insert([
        {
          email,
          password,
          nombre,
          telefono,
          direccion,
          tipo_usuario: "cliente",
          activo: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error al registrar usuario:", error);
      return { success: false, message: "Error al crear la cuenta" };
    }

    return {
      success: true,
      message: "Cuenta creada exitosamente",
      usuario: data as Usuario,
    };
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    return { success: false, message: "Error al crear la cuenta" };
  }
};
