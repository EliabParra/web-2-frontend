import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import BackButton from "@/components/BackButton";
import { TX } from "@/api/tx";
import { runTx, useTx } from "@/hooks/useTx";

interface Usuario {
  user_id: number;
  user_na: string;
  user_em: string | null;
  user_act: boolean;
  user_last_login_dt: string | null;
  person_ci: string | null;
  person_na: string | null;
  person_ln: string | null;
  person_ph: string | null;
  person_deg: string | null;
}

type UserForm = {
  user_id?: number;
  user_na: string;
  user_pw: string;
  user_em: string;
  user_act: "true" | "false";
  person_ci: string;
  person_na: string;
  person_ln: string;
  person_ph: string;
  person_deg: string;
};

const emptyForm: UserForm = {
  user_na: "", user_pw: "", user_em: "", user_act: "true",
  person_ci: "", person_na: "", person_ln: "", person_ph: "", person_deg: "",
};

const nullable = (value: string) => value.trim() || null;
const fullName = (u: Usuario) => [u.person_na, u.person_ln].filter(Boolean).join(" ") || "—";

const UsuariosModule = ({ onBack }: { onBack: () => void }) => {
  const { data, loading, error, reload } = useTx<Usuario[]>(TX.user.getAll);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState<UserForm | null>(null);

  const usuarios = data ?? [];
  const term = busqueda.toLowerCase();
  const filtered = usuarios.filter((u) =>
    fullName(u).toLowerCase().includes(term) || u.user_na.toLowerCase().includes(term)
  );

  const openEdit = (u: Usuario) =>
    setForm({
      user_id: u.user_id,
      user_na: u.user_na,
      user_pw: "",
      user_em: u.user_em ?? "",
      user_act: u.user_act ? "true" : "false",
      person_ci: u.person_ci ?? "",
      person_na: u.person_na ?? "",
      person_ln: u.person_ln ?? "",
      person_ph: u.person_ph ?? "",
      person_deg: u.person_deg ?? "",
    });

  const handleSave = async () => {
    if (!form) return;
    const { user_id, user_pw, ...fields } = form;
    const params = {
      user_na: fields.user_na,
      user_em: nullable(fields.user_em),
      user_act: fields.user_act === "true",
      person_ci: nullable(fields.person_ci),
      person_na: nullable(fields.person_na),
      person_ln: nullable(fields.person_ln),
      person_ph: nullable(fields.person_ph),
      person_deg: nullable(fields.person_deg),
    };
    const ok = user_id
      ? await runTx(TX.user.update, { user_id, ...params }, "Usuario actualizado")
      : await runTx(TX.user.create, { ...params, user_pw }, "Usuario creado");
    if (!ok) return;
    setForm(null);
    reload();
  };

  const handleDelete = async (u: Usuario) => {
    if (!window.confirm(`¿Eliminar el usuario "${u.user_na}"?`)) return;
    if (await runTx(TX.user.delete, { user_id: u.user_id }, "Usuario eliminado")) reload();
  };

  const field = (key: keyof UserForm, label: string, type = "text") =>
    form && (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input type={type} value={form[key] as string} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      </div>
    );

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-bold text-foreground">Gestión de Usuarios</h2>
        </div>
        <Button size="sm" onClick={() => setForm(emptyForm)}><Plus className="w-4 h-4 mr-1" /> Nuevo Usuario</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle className="w-6 h-6 text-emerald-500" /><div><p className="text-2xl font-bold text-foreground">{usuarios.filter((u) => u.user_act).length}</p><p className="text-xs text-muted-foreground">Activos</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><XCircle className="w-6 h-6 text-muted-foreground" /><div><p className="text-2xl font-bold text-foreground">{usuarios.filter((u) => !u.user_act).length}</p><p className="text-xs text-muted-foreground">Inactivos</p></div></CardContent></Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar usuario..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-10" />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-mono text-xs">{u.user_id}</TableCell>
                  <TableCell className="font-medium">{u.user_na}</TableCell>
                  <TableCell>{fullName(u)}</TableCell>
                  <TableCell className="text-muted-foreground">{u.user_em ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className={u.user_act ? "bg-emerald-600 hover:bg-emerald-700" : "bg-secondary text-secondary-foreground"}>
                      {u.user_act ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.user_last_login_dt ? new Date(u.user_last_login_dt).toLocaleString("es-VE") : "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(u)} aria-label="Editar"><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(u)} className="text-destructive hover:text-destructive" aria-label="Eliminar"><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No se encontraron usuarios</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={form !== null} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form?.user_id ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                {field("user_na", "Username")}
                {field("person_ci", "Cédula")}
                {field("person_na", "Nombre")}
                {field("person_ln", "Apellido")}
                {field("person_ph", "Teléfono")}
                {field("person_deg", "Carrera")}
              </div>
              {field("user_em", "Email", "email")}
              {!form.user_id && field("user_pw", "Clave", "password")}
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.user_act} onValueChange={(v) => setForm({ ...form, user_act: v as UserForm["user_act"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsuariosModule;
