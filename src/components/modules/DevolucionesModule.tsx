import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PackageSearch, Search, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { TX } from "@/api/tx";
import { runTx, useTx } from "@/hooks/useTx";

/** Loan summary as returned by the Devolution BO (movement types 4 = prestado, 5 = devuelto). */
export interface PrestamoResumen {
  movement_id: number;
  user_id: number;
  movement_booking_dt: string | null;
  movement_estimated_return_dt: string | null;
  movement_type_id: number;
  total_items: number;
  returned_items: number;
  pending_items: number;
  damaged_items: number;
}

export interface Usuario {
  user_id: number;
  user_na: string;
  person_ci?: string | null;
  person_na?: string | null;
  person_ln?: string | null;
}

interface LineaPrestamo {
  movement_detail_id: number;
  movement_detail_am: number;
  item_na?: string;
  location_de?: string;
}

export const LOAN_TYPE = 4;
export const RETURNED_TYPE = 5;

export const fecha = (v: string | null) => (v ? new Date(v).toLocaleDateString("es-VE") : "—");

export const estadoPrestamo = (p: PrestamoResumen): "activo" | "vencido" | "devuelto" => {
  if (p.movement_type_id === RETURNED_TYPE) return "devuelto";
  return p.movement_estimated_return_dt && new Date(p.movement_estimated_return_dt) < new Date() ? "vencido" : "activo";
};

export const usuarioDe = (usuarios: Usuario[] | null, id: number) => {
  const u = usuarios?.find((x) => x.user_id === id);
  return {
    nombre: u ? [u.person_na, u.person_ln].filter(Boolean).join(" ") || u.user_na : `Usuario #${id}`,
    cedula: u?.person_ci ?? "—",
  };
};

interface DialogProps {
  movementId: number;
  usuario: string;
  onClose: () => void;
  onDone: () => void;
}

/** Registers the return of every line of a loan. Mount it only while a loan is selected. */
export const RegistrarDevolucionDialog = ({ movementId, usuario, onClose, onDone }: DialogProps) => {
  const { data, loading, error } = useTx<{ details?: LineaPrestamo[] }>(TX.loan.getLoan, { movement_id: movementId });
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [danos, setDanos] = useState<Record<number, string>>({});
  const [observaciones, setObservaciones] = useState("");
  const lineas = data?.details ?? [];

  const save = async () => {
    const details = lineas.map((l) => ({
      movement_detail_id: l.movement_detail_id,
      returned_am: cantidades[l.movement_detail_id] ?? l.movement_detail_am,
      damage_ob: danos[l.movement_detail_id] || undefined,
    }));
    const ok = await runTx(
      TX.devolution.registerDevolution,
      { movement_id: movementId, devolution_ob: observaciones || undefined, details },
      "Devolución registrada",
    );
    if (ok) onDone();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Devolución</DialogTitle>
          <DialogDescription>Préstamo #{movementId} de {usuario}. Indique lo devuelto por cada componente.</DialogDescription>
        </DialogHeader>
        {loading && <p className="text-sm text-muted-foreground">Cargando préstamo...</p>}
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="space-y-4">
          {lineas.map((l) => (
            <div key={l.movement_detail_id} className="grid grid-cols-2 gap-3 border-b border-border pb-3">
              <div className="col-span-2 text-sm">
                <span className="font-medium text-foreground">{l.item_na ?? `Detalle #${l.movement_detail_id}`}</span>
                {l.location_de && <span className="text-muted-foreground"> — {l.location_de}</span>}
              </div>
              <div className="space-y-2">
                <Label>Cantidad devuelta (máx: {l.movement_detail_am})</Label>
                <Input
                  type="number"
                  min={0}
                  max={l.movement_detail_am}
                  value={cantidades[l.movement_detail_id] ?? String(l.movement_detail_am)}
                  onChange={(e) => setCantidades({ ...cantidades, [l.movement_detail_id]: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Daños (opcional)</Label>
                <Input
                  placeholder="Describa el daño"
                  value={danos[l.movement_detail_id] ?? ""}
                  onChange={(e) => setDanos({ ...danos, [l.movement_detail_id]: e.target.value })}
                />
              </div>
            </div>
          ))}
          <div className="space-y-2">
            <Label>Observaciones (opcional)</Label>
            <Input placeholder="Observaciones generales" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={lineas.length === 0}>Confirmar Devolución</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DevolucionesModule = () => {
  const { data, loading, error, reload } = useTx<PrestamoResumen[]>(TX.devolution.getAllDevolutions);
  const usuarios = useTx<Usuario[]>(TX.user.getAll);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PrestamoResumen | null>(null);

  const prestamos = (data ?? []).filter((p) => p.movement_type_id === LOAN_TYPE);
  const filtered = prestamos.filter((p) => {
    const u = usuarioDe(usuarios.data, p.user_id);
    return `${p.movement_id} ${u.nombre} ${u.cedula}`.toLowerCase().includes(search.toLowerCase());
  });

  const vencidos = prestamos.filter((p) => estadoPrestamo(p) === "vencido").length;
  const activos = prestamos.length - vencidos;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PackageSearch className="w-7 h-7 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Devoluciones</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="w-5 h-5 text-primary" /><div><p className="text-2xl font-bold text-foreground">{activos}</p><p className="text-xs text-muted-foreground">Activos</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-destructive" /><div><p className="text-2xl font-bold text-foreground">{vencidos}</p><p className="text-xs text-muted-foreground">Vencidos</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-accent" /><div><p className="text-2xl font-bold text-foreground">{prestamos.length}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">Préstamos Pendientes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por ID, usuario o cédula..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <TableHead>Fecha Préstamo</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const u = usuarioDe(usuarios.data, p.user_id);
                const vencido = estadoPrestamo(p) === "vencido";
                return (
                  <TableRow key={p.movement_id}>
                    <TableCell className="font-mono text-xs">{p.movement_id}</TableCell>
                    <TableCell>{u.nombre}</TableCell>
                    <TableCell className="text-xs">{u.cedula}</TableCell>
                    <TableCell>{p.total_items}</TableCell>
                    <TableCell>{fecha(p.movement_booking_dt)}</TableCell>
                    <TableCell>{fecha(p.movement_estimated_return_dt)}</TableCell>
                    <TableCell>
                      <Badge variant={vencido ? "destructive" : "default"}>{vencido ? "Vencido" : "Activo"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => setSelected(p)}>Devolver</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No se encontraron préstamos</TableCell></TableRow>
              )}
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

export default DevolucionesModule;
