import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PackageSearch, Search, CheckCircle, Clock, AlertTriangle, RotateCcw } from "lucide-react";
import BackButton from "@/components/BackButton";
import { TX } from "@/api/tx";
import { useTx } from "@/hooks/useTx";
import {
  LOAN_TYPE, RegistrarDevolucionDialog, fecha, usuarioDe, type PrestamoResumen, type Usuario,
} from "@/components/modules/DevolucionesModule";

type Estado = "completa" | "parcial" | "pendiente" | "con_daños";

const estadoDe = (d: PrestamoResumen): Estado => {
  if (d.movement_type_id === LOAN_TYPE) return "pendiente";
  if (d.damaged_items > 0) return "con_daños";
  return d.pending_items > 0 ? "parcial" : "completa";
};

const estadoConfig: Record<Estado, { variant: "default" | "destructive" | "secondary" | "outline"; label: string }> = {
  completa: { variant: "default", label: "Completa" },
  parcial: { variant: "outline", label: "Parcial" },
  pendiente: { variant: "secondary", label: "Pendiente" },
  con_daños: { variant: "destructive", label: "Con Daños" },
};

interface Props {
  onBack: () => void;
}

const DevolucionesAdminModule = ({ onBack }: Props) => {
  const { data, loading, error, reload } = useTx<PrestamoResumen[]>(TX.devolution.getAllDevolutions);
  const usuarios = useTx<Usuario[]>(TX.user.getAll);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [selected, setSelected] = useState<PrestamoResumen | null>(null);

  const devoluciones = data ?? [];
  const filtered = devoluciones.filter((d) => {
    const u = usuarioDe(usuarios.data, d.user_id);
    const matchSearch = `${d.movement_id} ${u.nombre} ${u.cedula}`.toLowerCase().includes(search.toLowerCase());
    const matchFiltro = filtro === "todos" || estadoDe(d) === filtro;
    return matchSearch && matchFiltro;
  });

  const contar = (estado: Estado) => devoluciones.filter((d) => estadoDe(d) === estado).length;

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex items-center gap-3">
        <PackageSearch className="w-7 h-7 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Gestión de Devoluciones</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-primary" /><div><p className="text-2xl font-bold text-foreground">{contar("completa")}</p><p className="text-xs text-muted-foreground">Completas</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="w-5 h-5 text-accent" /><div><p className="text-2xl font-bold text-foreground">{contar("pendiente")}</p><p className="text-xs text-muted-foreground">Pendientes</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-destructive" /><div><p className="text-2xl font-bold text-foreground">{contar("con_daños")}</p><p className="text-xs text-muted-foreground">Con Daños</p></div></CardContent></Card>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">Registro de Devoluciones</CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {["todos", "completa", "parcial", "pendiente", "con_daños"].map((f) => (
                  <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filtro === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                    {f === "con_daños" ? "Con Daños" : f.charAt(0).toUpperCase() + f.slice(1)}
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
                <TableHead>Préstamo</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Ítems</TableHead>
                <TableHead>Devueltos</TableHead>
                <TableHead>Pendientes</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => {
                const u = usuarioDe(usuarios.data, d.user_id);
                const estado = estadoDe(d);
                return (
                  <TableRow key={d.movement_id}>
                    <TableCell className="font-mono text-xs">{d.movement_id}</TableCell>
                    <TableCell className="font-medium">{u.nombre}</TableCell>
                    <TableCell className="text-xs">{u.cedula}</TableCell>
                    <TableCell>{d.total_items}</TableCell>
                    <TableCell>{d.returned_items}</TableCell>
                    <TableCell>{d.pending_items}</TableCell>
                    <TableCell>{fecha(d.movement_estimated_return_dt)}</TableCell>
                    <TableCell><Badge variant={estadoConfig[estado].variant}>{estadoConfig[estado].label}</Badge></TableCell>
                    <TableCell>
                      {estado === "pendiente" && (
                        <Button size="sm" variant="outline" onClick={() => setSelected(d)}>
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />Procesar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No se encontraron devoluciones</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected && (
        <RegistrarDevolucionDialog
          movementId={selected.movement_id}
          usuario={usuarioDe(usuarios.data, selected.user_id).nombre}
          onClose={() => setSelected(null)}
          onDone={() => {
            setSelected(null);
            reload();
          }}
        />
      )}
    </div>
  );
};

export default DevolucionesAdminModule;
