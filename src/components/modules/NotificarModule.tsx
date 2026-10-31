import { useState } from "react";
import { Send, AlertTriangle, Clock, User } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TX } from "@/api/tx";
import { runTx, useTx } from "@/hooks/useTx";
import type { Notificacion } from "@/components/NotificationsPanel";

interface Usuario { user_id: number; user_na: string; person_na: string | null; person_ln: string | null; person_ci: string | null }
interface Vencido { user_id: number; loans_overdue: number; items_overdue: number; oldest_due_dt: string }
interface Reporte<T> { data: T[] }

// Report catalog id 1 = "overdue_loans" in ReportRepository.
const OVERDUE_REPORT = { id: 1 };

const nombreDe = (u?: Usuario) =>
  u ? [u.person_na, u.person_ln].filter(Boolean).join(" ") || u.user_na : "Usuario desconocido";
const fecha = (dt: string) => new Date(dt).toLocaleDateString("es");
const diasDesde = (dt: string) => Math.max(0, Math.floor((Date.now() - new Date(dt).getTime()) / 86_400_000));

const NotificarModule = () => {
  const usuarios = useTx<Usuario[]>(TX.user.getAll);
  const vencidos = useTx<Reporte<Vencido>>(TX.report.get, OVERDUE_REPORT);
  const [destinatario, setDestinatario] = useState("");
  const [tipo, setTipo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [historial, setHistorial] = useState<Notificacion[]>([]);

  const usuarioDe = (id: number) => usuarios.data?.find((u) => u.user_id === id);

  const enviar = async (user_id: number, notification_ty: string, notification_msg: string) => {
    const res = await runTx<Notificacion>(
      TX.notification.create,
      { user_id, notification_ty, notification_tit: notification_ty, notification_msg },
      `Notificación enviada a ${nombreDe(usuarioDe(user_id))}`,
    );
    if (res) setHistorial((prev) => [res.data, ...prev]);
    return res;
  };

  const enviarNotificacion = async () => {
    if (!destinatario || !tipo || !mensaje.trim()) {
      toast.error("Complete todos los campos antes de enviar.");
      return;
    }
    if (await enviar(Number(destinatario), tipo, mensaje.trim())) {
      setDestinatario("");
      setTipo("");
      setMensaje("");
    }
  };

  const notificarDirecto = (v: Vencido) => {
    const msg = `Estimado(a) ${nombreDe(usuarioDe(v.user_id))}, tiene ${v.loans_overdue} préstamo(s) vencido(s) con ${v.items_overdue} ítem(s) pendiente(s) desde el ${fecha(v.oldest_due_dt)}. Por favor acérquese al laboratorio para regularizar su situación.`;
    enviar(v.user_id, "Vencimiento", msg);
  };

  const listaVencidos = vencidos.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Notificar Usuarios</h2>
        <p className="text-sm text-muted-foreground">Envíe notificaciones a usuarios con préstamos vencidos o recordatorios</p>
      </div>

      {/* Users with overdue loans */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Préstamos Vencidos
        </h3>
        {vencidos.loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : vencidos.error ? (
          <p className="text-sm text-destructive">{vencidos.error}</p>
        ) : listaVencidos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay préstamos vencidos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {listaVencidos.map((v) => (
              <div
                key={v.user_id}
                className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-accent transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground text-sm truncate">{nombreDe(usuarioDe(v.user_id))}</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    {v.loans_overdue} préstamo(s), {v.items_overdue} ítem(s)
                  </p>
                  <div className="flex items-center gap-2 ml-6 mt-1">
                    <Clock className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-red-400">{diasDesde(v.oldest_due_dt)} días de retraso</span>
                  </div>
                </div>
                <Button size="sm" onClick={() => notificarDirecto(v)} className="shrink-0 ml-3">
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Notificar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual notification form */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-base font-semibold text-foreground mb-4">Enviar Notificación Manual</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Destinatario</label>
            <Select value={destinatario} onValueChange={setDestinatario}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Seleccionar usuario" />
              </SelectTrigger>
              <SelectContent>
                {(usuarios.data ?? []).map((u) => (
                  <SelectItem key={u.user_id} value={String(u.user_id)}>
                    {nombreDe(u)}{u.person_ci ? ` — ${u.person_ci}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Tipo</label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Tipo de notificación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vencimiento">Vencimiento</SelectItem>
                <SelectItem value="Recordatorio">Recordatorio</SelectItem>
                <SelectItem value="Información">Información</SelectItem>
                <SelectItem value="Urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-1.5 block">Mensaje</label>
          <Textarea
            placeholder="Escriba el mensaje de la notificación..."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            className="bg-background border-border min-h-[80px]"
          />
        </div>
        <Button onClick={enviarNotificacion}>
          <Send className="w-4 h-4 mr-2" />
          Enviar Notificación
        </Button>
      </div>

      {/* Sent in this session: the backend only lists the logged-in user's own notifications. */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">Enviadas en esta sesión</h3>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-3 text-muted-foreground font-medium">Fecha</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Destinatario</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Tipo</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((n) => (
                <tr key={n.notification_id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="p-3 text-foreground">{fecha(n.notification_dt)}</td>
                  <td className="p-3 text-foreground">{nombreDe(usuarioDe(n.user_id))}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={
                      n.notification_ty === "Vencimiento" ? "bg-red-500/15 text-red-400 border-red-500/30" :
                      n.notification_ty === "Urgente" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                      "bg-blue-500/15 text-blue-400 border-blue-500/30"
                    }>
                      {n.notification_ty}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground max-w-xs truncate">{n.notification_msg}</td>
                </tr>
              ))}
              {historial.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Aún no se han enviado notificaciones.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NotificarModule;
