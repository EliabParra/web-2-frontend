import { useState } from "react";
import { Key, Search, UserCircle, Shield, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { TX } from "@/api/tx";
import { runTx, useTx } from "@/hooks/useTx";

interface Usuario {
  user_id: number;
  user_na: string;
  person_ci: string | null;
  person_na: string | null;
  person_ln: string | null;
  profile_ids: number[];
}

interface Perfil {
  profile_id: number;
  profile_na: string;
}

const displayName = (u: Usuario) => [u.person_na, u.person_ln].filter(Boolean).join(" ") || u.user_na;

/** Access is granted through profiles: a user sees the modules their profiles allow. */
const PermisosModule = () => {
  const usuarios = useTx<Usuario[]>(TX.user.getAll);
  const perfiles = useTx<Perfil[]>(TX.profile.getAll);
  const [busqueda, setBusqueda] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState("todos");
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [perfilesTemp, setPerfilesTemp] = useState<number[]>([]);

  const users = usuarios.data ?? [];
  const profiles = perfiles.data ?? [];
  const profileName = (id: number) => profiles.find((p) => p.profile_id === id)?.profile_na ?? `#${id}`;

  const filtered = users.filter((u) => {
    const matchBusqueda =
      displayName(u).toLowerCase().includes(busqueda.toLowerCase()) || (u.person_ci ?? "").includes(busqueda);
    const matchPerfil = filtroPerfil === "todos" || u.profile_ids.includes(Number(filtroPerfil));
    return matchBusqueda && matchPerfil;
  });

  const abrirEditor = (usuario: Usuario) => {
    setEditando(usuario);
    setPerfilesTemp([...usuario.profile_ids]);
  };

  const guardarCambios = async () => {
    if (!editando) return;
    const { user_id } = editando;
    const toAssign = perfilesTemp.filter((id) => !editando.profile_ids.includes(id));
    const toRevoke = editando.profile_ids.filter((id) => !perfilesTemp.includes(id));
    for (const profile_id of toAssign) {
      await runTx(TX.user.assignProfile, { user_id, profile_id }, `Perfil ${profileName(profile_id)} asignado`);
    }
    for (const profile_id of toRevoke) {
      await runTx(TX.user.revokeProfile, { user_id, profile_id }, `Perfil ${profileName(profile_id)} revocado`);
    }
    setEditando(null);
    usuarios.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Asignar Permisos</h2>
        <p className="text-sm text-muted-foreground">Asigne perfiles a los usuarios; cada perfil define a qué módulos tiene acceso</p>
      </div>

      {(usuarios.error || perfiles.error) && (
        <p className="text-destructive text-sm">{usuarios.error ?? perfiles.error}</p>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {profiles.map((p) => (
          <div key={p.profile_id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3 h-3" />
              <p className="text-sm text-muted-foreground">{p.profile_na}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {users.filter((u) => u.profile_ids.includes(p.profile_id)).length}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select value={filtroPerfil} onValueChange={setFiltroPerfil}>
          <SelectTrigger className="w-40 bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los perfiles</SelectItem>
            {profiles.map((p) => (
              <SelectItem key={p.profile_id} value={String(p.profile_id)}>{p.profile_na}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left p-3 text-muted-foreground font-medium">Usuario</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Cédula</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Perfiles</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground font-medium">{displayName(u)}</span>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{u.person_ci ?? "—"}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {u.profile_ids.map((id) => (
                      <Badge key={id} variant="outline" className="gap-1">
                        <Shield className="w-3 h-3" />
                        {profileName(id)}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => abrirEditor(u)}>
                    <Key className="w-3.5 h-3.5 mr-1" />
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
            {!usuarios.loading && filtered.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No se encontraron usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editando} onOpenChange={(open) => !open && setEditando(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Key className="w-5 h-5" />
              Perfiles — {editando && displayName(editando)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {profiles.map((p) => (
              <div key={p.profile_id} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{p.profile_na}</span>
                <Switch
                  checked={perfilesTemp.includes(p.profile_id)}
                  onCheckedChange={(checked) =>
                    setPerfilesTemp((prev) =>
                      checked ? [...prev, p.profile_id] : prev.filter((id) => id !== p.profile_id)
                    )
                  }
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={guardarCambios}>
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PermisosModule;
