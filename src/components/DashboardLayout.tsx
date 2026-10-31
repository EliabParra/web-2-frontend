import { ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import URULogo from "./URULogo";
import NotificationsPanel from "./NotificationsPanel";
import BackButton from "./BackButton";
import InventarioModule from "./modules/InventarioModule";
import SolicitudesModule from "./modules/SolicitudesModule";
import SolvenciaModule from "./modules/SolvenciaModule";
import ReportesModule from "./modules/ReportesModule";
import DevolucionesModule from "./modules/DevolucionesModule";
import PrestamosModule from "./modules/PrestamosModule";
import UbicacionModule from "./modules/UbicacionModule";
import NotificarModule from "./modules/NotificarModule";
import PermisosModule from "./modules/PermisosModule";
import MantenimientoModule from "./modules/MantenimientoModule";
import AuditoriaModule from "./modules/AuditoriaModule";
import PrestamosAdminModule from "./modules/negocio/PrestamosAdminModule";
import DevolucionesAdminModule from "./modules/negocio/DevolucionesAdminModule";
import NotificacionesAdminModule from "./modules/negocio/NotificacionesAdminModule";
import ReportesAdminModule from "./modules/negocio/ReportesAdminModule";
import UsuariosModule from "./modules/seguridad/UsuariosModule";
import PersonasModule from "./modules/seguridad/PersonasModule";
import GruposModule from "./modules/seguridad/GruposModule";
import PerfilModule from "./modules/seguridad/PerfilModule";
import SubsistemaModule from "./modules/seguridad/SubsistemaModule";
import ObjetosModule from "./modules/seguridad/ObjetosModule";
import MetodosModule from "./modules/seguridad/MetodosModule";
import PermisosModModule from "./modules/seguridad/PermisosModModule";
import NotificacionModule from "./modules/seguridad/NotificacionModule";
import CalendarioModule from "./modules/seguridad/CalendarioModule";
import ThemeToggle from "./ThemeToggle";
import {
  User, LogOut, ChevronRight, Menu, X,
  FileText, HandCoins, ShieldCheck, PackageSearch, MapPin, BarChart3,
  Send, Settings, Building2, Users, UserCircle, Key, Blocks,
  Box, Waypoints, CalendarDays, Lock, Bell, Wrench, ClipboardList
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "./ui/dropdown-menu";

interface MenuItem {
  label: string;
  icon: ReactNode;
  key: string;
}

// Every module is listed for every user; the backend decides what each profile may execute.
const menuItems: MenuItem[] = [
  { label: "Solicitudes", icon: <FileText className="w-5 h-5" />, key: "solicitudes" },
  { label: "Préstamos", icon: <HandCoins className="w-5 h-5" />, key: "prestamos" },
  { label: "Solvencia", icon: <ShieldCheck className="w-5 h-5" />, key: "solvencia" },
  { label: "Devoluciones", icon: <PackageSearch className="w-5 h-5" />, key: "devoluciones" },
  { label: "Inventario", icon: <Blocks className="w-5 h-5" />, key: "inventario" },
  { label: "Ubicación", icon: <MapPin className="w-5 h-5" />, key: "ubicacion" },
  { label: "Reportes", icon: <BarChart3 className="w-5 h-5" />, key: "reportes" },
  { label: "Notificar", icon: <Send className="w-5 h-5" />, key: "notificar" },
  { label: "Seguridad", icon: <Lock className="w-5 h-5" />, key: "seguridad" },
  { label: "Negocio", icon: <Building2 className="w-5 h-5" />, key: "negocio" },
  { label: "Asignar Permisos", icon: <Key className="w-5 h-5" />, key: "permisos" },
];

const seguridadModules = [
  { label: "Usuarios", icon: <Users className="w-8 h-8" />, key: "seg_usuarios" },
  { label: "Personas", icon: <UserCircle className="w-8 h-8" />, key: "seg_personas" },
  { label: "Grupos", icon: <Users className="w-8 h-8" />, key: "seg_grupos" },
  { label: "Perfil", icon: <User className="w-8 h-8" />, key: "seg_perfil" },
  { label: "Subsistema", icon: <Settings className="w-8 h-8" />, key: "seg_subsistema" },
  { label: "Objetos", icon: <Box className="w-8 h-8" />, key: "seg_objetos" },
  { label: "Métodos", icon: <Waypoints className="w-8 h-8" />, key: "seg_metodos" },
  { label: "Permisos", icon: <Key className="w-8 h-8" />, key: "seg_permisos" },
  { label: "Notificación", icon: <Bell className="w-8 h-8" />, key: "seg_notificacion" },
  { label: "Calendario Académico", icon: <CalendarDays className="w-8 h-8" />, key: "seg_calendario" },
];

const negocioModules = [
  { label: "Mantenimiento", icon: <Wrench className="w-8 h-8" />, key: "mantenimiento" },
  { label: "Préstamos", icon: <HandCoins className="w-8 h-8" />, key: "prestamos_admin" },
  { label: "Devoluciones", icon: <PackageSearch className="w-8 h-8" />, key: "devoluciones_admin" },
  { label: "Notificaciones", icon: <Bell className="w-8 h-8" />, key: "notificaciones_admin" },
  { label: "Reportes", icon: <BarChart3 className="w-8 h-8" />, key: "reportes_admin" },
  { label: "Auditoría", icon: <ClipboardList className="w-8 h-8" />, key: "auditoria" },
];

const DashboardLayout = ({ children }: { children?: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <header className="bg-[rgb(27,67,152)] text-white dark:bg-card dark:text-foreground border-b border-border px-4 py-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white dark:text-foreground hover:bg-white/10 dark:hover:bg-secondary">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <URULogo size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationsPanel />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white dark:text-foreground hover:bg-white/10 dark:hover:bg-secondary"><User className="w-5 h-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <div className="px-3 py-2">
                <p className="font-semibold text-sm text-foreground">{user.user_na}</p>
                <p className="text-xs text-muted-foreground">{user.user_em}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-foreground" onClick={() => setActiveItem("seg_perfil")}>Ver Perfil</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout().then(() => navigate("/login"))} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`bg-card border-r border-border transition-all duration-300 shrink-0 ${sidebarOpen ? "w-56" : "w-0 overflow-hidden"}`}>
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveItem(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeItem === item.key ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto p-6">
          {children || <DefaultContent activeItem={activeItem} onNavigate={setActiveItem} />}
        </main>
      </div>
    </div>
  );
};

const DefaultContent = ({ activeItem, onNavigate }: { activeItem: string; onNavigate?: (key: string) => void }) => {
  const goHome = () => onNavigate?.("");
  const goSeguridad = () => onNavigate?.("seguridad");
  const goNegocio = () => onNavigate?.("negocio");

  // === Main modules ===
  if (activeItem === "solicitudes") return <><BackButton onClick={goHome} /><SolicitudesModule /></>;
  if (activeItem === "prestamos") return <><BackButton onClick={goHome} /><PrestamosModule /></>;
  if (activeItem === "solvencia") return <><BackButton onClick={goHome} /><SolvenciaModule /></>;
  if (activeItem === "devoluciones") return <><BackButton onClick={goHome} /><DevolucionesModule /></>;
  if (activeItem === "inventario") return <><BackButton onClick={goHome} /><InventarioModule /></>;
  if (activeItem === "ubicacion") return <><BackButton onClick={goHome} /><UbicacionModule /></>;
  if (activeItem === "reportes") return <><BackButton onClick={goHome} /><ReportesModule /></>;
  if (activeItem === "notificar") return <><BackButton onClick={goHome} /><NotificarModule /></>;

  // === Admin: Asignar Permisos ===
  if (activeItem === "permisos") return <><BackButton onClick={goHome} /><PermisosModule /></>;

  // === Admin: Seguridad sub-modules ===
  if (activeItem === "seg_usuarios") return <UsuariosModule onBack={goSeguridad} />;
  if (activeItem === "seg_personas") return <PersonasModule onBack={goSeguridad} />;
  if (activeItem === "seg_grupos") return <GruposModule onBack={goSeguridad} />;
  if (activeItem === "seg_perfil") return <PerfilModule onBack={goHome} />;
  if (activeItem === "seg_subsistema") return <SubsistemaModule onBack={goSeguridad} />;
  if (activeItem === "seg_objetos") return <ObjetosModule onBack={goSeguridad} />;
  if (activeItem === "seg_metodos") return <MetodosModule onBack={goSeguridad} />;
  if (activeItem === "seg_permisos") return <PermisosModModule onBack={goSeguridad} />;
  if (activeItem === "seg_notificacion") return <NotificacionModule onBack={goSeguridad} />;
  if (activeItem === "seg_calendario") return <CalendarioModule onBack={goSeguridad} />;

  // === Admin: Negocio sub-modules ===
  if (activeItem === "mantenimiento") return <><BackButton onClick={goNegocio} /><MantenimientoModule /></>;
  if (activeItem === "prestamos_admin") return <PrestamosAdminModule onBack={goNegocio} />;
  if (activeItem === "devoluciones_admin") return <DevolucionesAdminModule onBack={goNegocio} />;
  if (activeItem === "notificaciones_admin") return <NotificacionesAdminModule onBack={goNegocio} />;
  if (activeItem === "reportes_admin") return <ReportesAdminModule onBack={goNegocio} />;
  if (activeItem === "auditoria") return <><BackButton onClick={goNegocio} /><AuditoriaModule /></>;

  // === Admin: Seguridad grid ===
  if (activeItem === "seguridad") {
    return (
      <div>
        <BackButton onClick={goHome} />
        <h2 className="text-xl font-bold text-foreground mb-6">Módulos de Seguridad</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {seguridadModules.map((mod) => (
            <button key={mod.key} onClick={() => onNavigate?.(mod.key)} className="bg-card hover:bg-secondary border border-border rounded-xl p-5 flex flex-col items-center gap-3 transition-all hover:scale-105 hover:border-accent group">
              <div className="text-accent group-hover:text-lab-blue-glow transition-colors">{mod.icon}</div>
              <span className="text-sm font-medium text-foreground text-center">{mod.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // === Admin: Negocio grid ===
  if (activeItem === "negocio") {
    return (
      <div>
        <BackButton onClick={goHome} />
        <h2 className="text-xl font-bold text-foreground mb-6">Módulos de Negocio</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {negocioModules.map((mod) => (
            <button key={mod.key} onClick={() => onNavigate?.(mod.key)} className="bg-card hover:bg-secondary border border-border rounded-xl p-5 flex flex-col items-center gap-3 transition-all hover:scale-105 hover:border-accent group">
              <div className="text-accent group-hover:text-lab-blue-glow transition-colors">{mod.icon}</div>
              <span className="text-sm font-medium text-foreground text-center">{mod.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // === Home: module grid ===
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-2">Bienvenido al Sistema</h2>
      <p className="text-sm text-muted-foreground mb-6">Seleccione un módulo para comenzar</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {menuItems.map((item) => (
          <button key={item.key} onClick={() => onNavigate?.(item.key)} className="bg-card hover:bg-secondary border border-border rounded-xl p-5 flex flex-col items-center gap-3 transition-all hover:scale-105 hover:border-accent group">
            <div className="text-accent group-hover:text-lab-blue-glow transition-colors [&>svg]:w-8 [&>svg]:h-8">{item.icon}</div>
            <span className="text-sm font-medium text-foreground text-center">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardLayout;
