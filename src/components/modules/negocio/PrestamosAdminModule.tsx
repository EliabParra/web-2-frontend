import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { HandCoins, Search, Clock, AlertTriangle, CheckCircle, XCircle, PackageCheck } from "lucide-react";
import BackButton from "@/components/BackButton";
import { TX } from "@/api/tx";
import { runTx, useTx } from "@/hooks/useTx";
import { useAuth } from "@/contexts/AuthContext";
import {
  estadoPrestamo, fecha, usuarioDe, type PrestamoResumen, type Usuario,
} from "@/components/modules/DevolucionesModule";
import { estadoSolicitud, fechaCorta, type Solicitud } from "@/components/modules/SolicitudesModule";

type Estado = "pendiente" | "aprobada" | "rechazada" | "activo" | "vencido" | "devuelto";

interface Fila {
  movement_id: number;
  user_id: number;
  items: number;
  fecha: string;
  limite: string;
  estado: Estado;
}

type Accion = { tipo: "aprobar" | "rechazar"; fila: Fila; fechaLimite: string; observacion: string };

const estadoBadge: Record<Estado, { variant: "default" | "destructive" | "secondary" | "outline"; label: string }> = {
  pendiente: { variant: "outline", label: "Pendiente" },
  aprobada: { variant: "secondary", label: "Aprobada" },
  rechazada: { variant: "outline", label: "Rechazada" },
  activo: { variant: "default", label: "Activo" },
  vencido: { variant: "destructive", label: "Vencido" },
  devuelto: { variant: "secondary", label: "Devuelto" },
};

interface Props {
  onBack: () => void;
}

const PrestamosAdminModule = ({ onBack }: Props) => {
  const { user } = useAuth();
  const solicitudes = useTx<Solicitud[]>(TX.loan.getAllRequests);
  const prestamos = useTx<PrestamoResumen[]>(TX.devolution.getAllDevolutions);
  const usuarios = useTx<Usuario[]>(TX.user.getAll);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [accion, setAccion] = useState<Accion | null>(null);

  const filas: Fila[] = [
    ...(solicitudes.data ?? []).map((s) => ({
      movement_id: s.movement_id,
      user_id: s.user_id,
      items: s.total_items,
      fecha: fechaCorta(s.movement_booking_dt),
      limite: fechaCorta(s.movement_estimated_return_dt),
      estado: estadoSolicitud[s.movement_type_id] ?? "pendiente",
    })),
    ...(prestamos.data ?? []).map((p) => ({
      movement_id: p.movement_id,
      user_id: p.user_id,
      items: p.total_items,
      fecha: fecha(p.movement_booking_dt),
      limite: fecha(p.movement_estimated_return_dt),
      estado: estadoPrestamo(p),
    })),
  ].sort((a, b) => b.movement_id - a.movement_id);

  const filtered = filas.filter((f) => {
    const u = usuarioDe(usuarios.data, f.user_id);
    const matchSearch = `${f.movement_id} ${u.nombre} ${u.cedula}`.toLowerCase().includes(search.toLowerCase());
    const matchFiltro = filtro === "todos" || f.estado === filtro;
    return matchSearch && matchFiltro;
  });

  const contar = (estado: Estado) => filas.filter((f) => f.estado === estado).length;
  const loading = solicitudes.loading || prestamos.loading;
  const error = solicitudes.error || prestamos.error;

  const reloadAll = () => {
    solicitudes.reload();
    prestamos.reload();
  };

  const confirmarAccion = async () => {
    if (!accion) return;
    const { tipo, fila, fechaLimite, observacion } = accion;
    if (tipo === "aprobar" && !fechaLimite) return toast.error("Indique la fecha límite de devolución.");
    if (tipo === "rechazar" && !observacion) return toast.error("Indique el motivo del rechazo.");
    const ok =
      tipo === "aprobar"
        ? await runTx(
            TX.loan.acceptRequestLoan,
            { movement_id: fila.movement_id, movement_estimated_return_dt: fechaLimite, movement_ob: observacion || undefined, actor_user_id: user?.user_id },
            "Solicitud aprobada",
          )
        : await runTx(
            TX.loan.rejectRequestLoan,
            { movement_id: fila.movement_id, movement_ob: observacion, actor_user_id: user?.user_id },
            "Solicitud rechazada",
          );
    if (!ok) return;
    setAccion(null);
    reloadAll();
  };

  const entregar = async (fila: Fila) => {
    if (!window.confirm(`¿Registrar la entrega del préstamo #${fila.movement_id}? Se descontará del inventario.`)) return;
    if (await runTx(TX.loan.registerLoan, { movement_id: fila.movement_id, actor_user_id: user?.user_id }, "Préstamo registrado")) reloadAll();
  };

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex items-center gap-3">
        <HandCoins className="w-7 h-7 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Gestión de Préstamos</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="w-5 h-5 text-accent" /><div><p className="text-2xl font-bold text-foreground">{contar("pendiente")}</p><p className="text-xs text-muted-foreground">Solicitudes Pendientes</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-primary" /><div><p className="text-2xl font-bold text-foreground">{contar("activo")}</p><p className="text-xs text-muted-foreground">Activos</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-destructive" /><div><p className="text-2xl font-bold text-foreground">{contar("vencido")}</p><p className="text-xs text-muted-foreground">Vencidos</p></div></CardContent></Card>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">Solicitudes y Préstamos</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1 flex-wrap">
                {["todos", "pendiente", "aprobada", "activo", "vencido", "devuelto", "rechazada"].map((f) => (
                  <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filtro === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Ítems</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => {
                const u = usuarioDe(usuarios.data, f.user_id);
                return (
                  <TableRow key={f.movement_id}>
                    <TableCell className="font-mono text-xs">{f.movement_id}</TableCell>
                    <TableCell className="font-medium">{u.nombre}</TableCell>
                    <TableCell className="text-xs">{u.cedula}</TableCell>
                    <TableCell>{f.items}</TableCell>
                    <TableCell>{f.fecha}</TableCell>
                    <TableCell>{f.limite}</TableCell>
                    <TableCell><Badge variant={estadoBadge[f.estado].variant}>{estadoBadge[f.estado].label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {f.estado === "pendiente" && (
                          <>
                            <Button variant="ghost" size="icon" aria-label="Aprobar" onClick={() => setAccion({ tipo: "aprobar", fila: f, fechaLimite: "", observacion: "" })}><CheckCircle className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" aria-label="Rechazar" className="text-destructive hover:text-destructive" onClick={() => setAccion({ tipo: "rechazar", fila: f, fechaLimite: "", observacion: "" })}><XCircle className="w-4 h-4" /></Button>
                          </>
                        )}
                        {f.estado === "aprobada" && (
                          <Button variant="outline" size="sm" onClick={() => entregar(f)}><PackageCheck className="w-4 h-4 mr-1" />Entregar</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No se encontraron préstamos</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={accion !== null} onOpenChange={(open) => !open && setAccion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{accion?.tipo === "aprobar" ? "Aprobar Solicitud" : "Rechazar Solicitud"}</DialogTitle>
            <DialogDescription>
              Solicitud #{accion?.fila.movement_id} de {accion ? usuarioDe(usuarios.data, accion.fila.user_id).nombre : ""}.
            </DialogDescription>
          </DialogHeader>
          {accion && (
            <div className="space-y-4">
              {accion.tipo === "aprobar" && (
                <div className="space-y-2">
                  <Label>Fecha Límite de Devolución</Label>
                  <Input type="date" value={accion.fechaLimite} onChange={(e) => setAccion({ ...accion, fechaLimite: e.target.value })} />
                </div>
              )}
              <div className="space-y-2">
                <Label>{accion.tipo === "aprobar" ? "Observación (opcional)" : "Motivo del rechazo"}</Label>
                <Input value={accion.observacion} onChange={(e) => setAccion({ ...accion, observacion: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccion(null)}>Cancelar</Button>
            <Button variant={accion?.tipo === "rechazar" ? "destructive" : "default"} onClick={confirmarAccion}>
              {accion?.tipo === "aprobar" ? "Aprobar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrestamosAdminModule;
