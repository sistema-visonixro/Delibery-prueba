import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import Login from "./pages/Login";
import HomeClient from "./pages/HomeClient";
import Platillos from "./pages/Platillos";
import Categoria from "./pages/Categoria";
import Categorias from "./pages/Categorias";
import Restaurantes from "./pages/Restaurantes";
import RestauranteDetalle from "./pages/RestauranteDetalle";
import DetallePlatillo from "./pages/DetallePlatillo";
import MiCuenta from "./pages/MiCuenta";

// Nuevas páginas del sistema de delivery
import Carrito from "./pages/Carrito";
import Pedidos from "./pages/Pedidos";
import DetallePedidoCliente from "./pages/DetallePedidoCliente";
import PedidosDisponibles from "./pages/repartidor/PedidosDisponibles";
import MisPedidos from "./pages/repartidor/MisPedidos";
import EntregaActiva from "./pages/repartidor/EntregaActiva";
import PerfilRepartidor from "./pages/repartidor/PerfilRepartidor";

// Dashboards por tipo de usuario
import DashboardRepartidor from "./pages/repartidor/DashboardRepartidor";
import DashboardRestaurante from "./pages/DashboardRestaurante";
import DashboardOperador from "./pages/DashboardOperador";
import DashboardAdmin from "./pages/DashboardAdmin";

// Páginas de gestión de restaurante
import GestionRestaurante from "./pages/restaurante/GestionRestaurante";
import GestionPlatillos from "./pages/restaurante/GestionPlatillos";
import PedidosRestaurante from "./pages/restaurante/PedidosRestaurante";

import "./App.css";
import BottomNav from "./components/BottomNav";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  return usuario ? <>{children}</> : <Navigate to="/" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <>{children}</>;
  }

  // Redireccionar según el tipo de usuario si ya está autenticado
  switch (usuario.tipo_usuario) {
    case "repartidor":
      return <Navigate to="/repartidor/dashboard" replace />;
    case "restaurante":
      return <Navigate to="/restaurante/dashboard" replace />;
    case "operador":
      return <Navigate to="/operador/dashboard" replace />;
    case "admin":
      return <Navigate to="/admin/dashboard" replace />;
    case "cliente":
    default:
      return <Navigate to="/home" replace />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomeClient />
          </ProtectedRoute>
        }
      />
      <Route
        path="/platillos/:categoriaId"
        element={
          <ProtectedRoute>
            <Platillos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categoria/:id"
        element={
          <ProtectedRoute>
            <Categoria />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categorias"
        element={
          <ProtectedRoute>
            <Categorias />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurantes"
        element={
          <ProtectedRoute>
            <Restaurantes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurante/:id"
        element={
          <ProtectedRoute>
            <RestauranteDetalle />
          </ProtectedRoute>
        }
      />
      <Route
        path="/platillo/:id"
        element={
          <ProtectedRoute>
            <DetallePlatillo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mi-cuenta"
        element={
          <ProtectedRoute>
            <MiCuenta />
          </ProtectedRoute>
        }
      />

      {/* Rutas del Carrito y Pedidos */}
      <Route
        path="/carrito"
        element={
          <ProtectedRoute>
            <Carrito />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pedidos"
        element={
          <ProtectedRoute>
            <Pedidos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pedido/:pedidoId"
        element={
          <ProtectedRoute>
            <DetallePedidoCliente />
          </ProtectedRoute>
        }
      />

      {/* Rutas del Repartidor */}
      <Route
        path="/repartidor/dashboard"
        element={
          <RoleProtectedRoute allowedRoles={["repartidor"]}>
            <DashboardRepartidor />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/repartidor/disponibles"
        element={
          <RoleProtectedRoute allowedRoles={["repartidor"]}>
            <PedidosDisponibles />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/repartidor/mis-pedidos"
        element={
          <RoleProtectedRoute allowedRoles={["repartidor"]}>
            <MisPedidos />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/repartidor/entrega/:pedidoId"
        element={
          <RoleProtectedRoute allowedRoles={["repartidor"]}>
            <EntregaActiva />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/repartidor/perfil"
        element={
          <RoleProtectedRoute allowedRoles={["repartidor"]}>
            <PerfilRepartidor />
          </RoleProtectedRoute>
        }
      />

      {/* Rutas de Dashboards por tipo de usuario */}
      <Route
        path="/restaurante/dashboard"
        element={
          <RoleProtectedRoute allowedRoles={["restaurante"]}>
            <DashboardRestaurante />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/restaurante/gestion"
        element={
          <RoleProtectedRoute allowedRoles={["restaurante"]}>
            <GestionRestaurante />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/restaurante/platillos"
        element={
          <RoleProtectedRoute allowedRoles={["restaurante"]}>
            <GestionPlatillos />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/restaurante/pedidos"
        element={
          <RoleProtectedRoute allowedRoles={["restaurante"]}>
            <PedidosRestaurante />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/operador/dashboard"
        element={
          <RoleProtectedRoute allowedRoles={["operador"]}>
            <DashboardOperador />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <DashboardAdmin />
          </RoleProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppContent() {
  const { usuario } = useAuth();

  return (
    <>
      <AppRoutes />
      {usuario && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
