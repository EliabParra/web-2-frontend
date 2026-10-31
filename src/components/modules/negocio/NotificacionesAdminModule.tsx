import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Bell, Search, Send, Plus, Trash2, Mail, Users } from "lucide-react";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";
import { TX } from "@/api/tx";
import { tx } from "@/api/client";
import { runTx, useTx } from "@/hooks/useTx";
import type { Notificacion } from "@/components/NotificationsPanel";

interface Usuario { user_id: number; user_na: string; person_na: string | null; person_ln: string | null }

const TIPOS = ["Vencimiento", "Recordatorio", "Información", "Urgente", "Sistema"] as const;
const ALL_USERS = "todos";

const tipoBadge: Record<string, string> = {
  Vencimiento: "bg-destructive/15 text-destructive border-destructive/30",
  Recordatorio: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  Información: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  Urgente: "bg-red-600/15 text-red-500 border-red-600/30",
  Sistema: "bg-muted text-muted-foreground border-border",
};

const nombreDe = (u?: Usuario) =>
  u ? [u.person_na, u.person_ln].filter(Boolean).join(" ") || u.user_na : "Usuario desconocido";

const emptyForm = { destinatario: "", tipo: "Información", asunto: "", mensaje: "" };

interface Props {
  onBack: () => void;
}

const NotificacionesAdminModule = ({ onBack }: Props) => {
  const usuarios = useTx<Usuario[]>(TX.user.getAll);
  const [enviadas, setEnviadas] = useState<Notificacion[]>([]);
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Notificacion | null>(null);
  const [form, setForm] = useState(emptyForm);

  const usuarioDe = (id: number) => usuarios.data?.find((u) => u.user_id === id);

  const filtered = enviadas.filter((n) => {
    const q = search.toLowerCase();
    const matchSearch = nombreDe(usuarioDe(n.user_id)).toLowerCase().includes(q) || (n.notification_tit ?? "").toLowerCase().includes(q);
    const matchTipo = filtroTipo === "todos" || n.notification_ty === filtroTipo;
    return matchSearch && matchTipo;
  });

  const openNew = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleSend = async () => {
    if (!form.destinatario || !form.asunto.trim() || !form.mensaje.trim()) {
      toast.error("Complete todos los campos");
      return;
    }
    const base = { notification_ty: form.tipo, notification_tit: form.asunto.trim(), notification_msg: form.mensaje.trim() };

    if (form.destinatario === ALL_USERS) {
      const results = await Promise.allSettled(
        (usuarios.data ?? []).map((u) => tx<Notificacion>(TX.notification.create, { ...base, user_id: u.user_id })),
      );
      const ok = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
      setEnviadas((prev) => [...ok, ...prev]);
      if (ok.length < results.length) toast.error(`${results.length - ok.length} notificación(es) no se pudieron enviar`);
      if (ok.length) toast.success(`Notificación enviada a ${ok.length} usuario(s)`);
      if (ok.length) setDialogOpen(false);
      return;
    }

    const userId = Number(form.destinatario);
    const res = await runTx<Notificacion>(TX.notification.create, { ...base, user_id: userId }, `Enviada a ${nombreDe(usuarioDe(userId))}`);
    if (!res) return;
    setEnviadas((prev) => [res.data, ...prev]);
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    const res = await runTx(TX.notification.delete, { id: deleteDialog.notification_id }, "Notificación eliminada");
    if (res) setEnviadas((prev) => prev.filter((n) => n.notification_id !== deleteDialog.notification_id));
    setDeleteDialog(null);
  };

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Gestión de Notificaciones</h2>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nueva Notificación</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><Mail className="w-5 h-5 text-primary" /><div><p className="text-2xl font-bold text-foreground">{enviadas.length}</p><p className="text-xs text-muted-foreground">Enviadas en esta sesión</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Users className="w-5 h-5 text-accent" /><div><p className="text-2xl font-bold text-foreground">{usuarios.data?.length ?? 0}</p><p className="text-xs text-muted-foreground">Usuarios destinatarios</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base">Enviadas en esta sesión</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Cada usuario ve sus notificaciones en la campana; el sistema no ofrece un historial global.</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Destinatario</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(n => (
                <TableRow key={n.notification_id}>
                  <TableCell className="font-mono text-xs">{n.notification_id}</TableCell>
                  <TableCell className="text-xs">{new Date(n.notification_dt).toLocaleString("es")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{nombreDe(usuarioDe(n.user_id))}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className={tipoBadge[n.notification_ty ?? ""] ?? tipoBadge.Sistema}>{n.notification_ty}</Badge></TableCell>
                  <TableCell className="max-w-[200px] truncate">{n.notification_tit}</TableCell>
                  <TableCell><Badge variant={n.notification_read ? "outline" : "default"}>{n.notification_read ? "Leída" : "No leída"}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteDialog(n)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No se encontraron notificaciones</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Notification Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Notificación</DialogTitle>
            <DialogDescription>Redacte y envíe una notificación a un usuario o a todos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Destinatario</Label>
                <Select value={form.destinatario} onValueChange={v => setForm({ ...form, destinatario: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_USERS}>Todos los usuarios</SelectItem>
                    {(usuarios.data ?? []).map((u) => (
                      <SelectItem key={u.user_id} value={String(u.user_id)}>{nombreDe(u)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Asunto</Label>
              <Input value={form.asunto} onChange={e => setForm({ ...form, asunto: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Mensaje</Label>
              <Textarea placeholder="Escriba el contenido de la notificación..." value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })} className="min-h-[100px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSend}><Send className="w-4 h-4 mr-2" />Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Notificación</DialogTitle>
            <DialogDescription>¿Está seguro de eliminar la notificación {deleteDialog?.notification_id}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificacionesAdminModule;
