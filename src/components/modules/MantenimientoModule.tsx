import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, Search, Plus, Pencil, Trash2, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { TX } from "@/api/tx";
import { runTx, useTx } from "@/hooks/useTx";
import CategoriasPanel from "./CategoriasPanel";

// Category types in the backend seed: 1 = "Equipo", 2 = "Componente".
const EQUIPMENT_TYPE = { category_type_id: 1 };
const COMPONENT_TYPE = { category_type_id: 2 };

type Tipo = "equipo" | "componente";
interface Item { item_id: number; item_cod: number; item_na: string; category_id: number }
interface Registro extends Item { tipo: Tipo }
interface Categoria { category_id: number; category_de: string }
type Form = { item_id?: number; tipo: Tipo; item_cod: string; item_na: string; category_id: string };

const TX_DE = { equipo: TX.equipment, componente: TX.component } as const;
const registroVacio: Form = { tipo: "componente", item_cod: "", item_na: "", category_id: "" };

const MantenimientoModule = () => {
  const equipos = useTx<Item[]>(TX.equipment.getAll);
  const componentes = useTx<Item[]>(TX.component.getAll);
  const catEquipos = useTx<Categoria[]>(TX.category.getAll, EQUIPMENT_TYPE);
  const catComponentes = useTx<Categoria[]>(TX.category.getAll, COMPONENT_TYPE);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [form, setForm] = useState<Form | null>(null);
  const [registroEliminar, setRegistroEliminar] = useState<Registro | null>(null);

  const registros: Registro[] = [
    ...(equipos.data ?? []).map((i) => ({ ...i, tipo: "equipo" as const })),
    ...(componentes.data ?? []).map((i) => ({ ...i, tipo: "componente" as const })),
  ];
  const categorias = (tipo: Tipo) => (tipo === "equipo" ? catEquipos.data : catComponentes.data) ?? [];
  const categoriaDe = (r: Registro) => categorias(r.tipo).find((c) => c.category_id === r.category_id)?.category_de ?? "—";
  const recargar = (tipo: Tipo) => (tipo === "equipo" ? equipos.reload() : componentes.reload());
  const loading = equipos.loading || componentes.loading;
  const error = equipos.error ?? componentes.error;

  const filtered = registros.filter((r) => {
    const q = busqueda.toLowerCase();
    const matchBusqueda = r.item_na.toLowerCase().includes(q) || String(r.item_cod).includes(q);
    const matchTipo = filtroTipo === "todos" || r.tipo === filtroTipo;
    return matchBusqueda && matchTipo;
  });

  const handleEditar = (r: Registro) =>
    setForm({ item_id: r.item_id, tipo: r.tipo, item_cod: String(r.item_cod), item_na: r.item_na, category_id: String(r.category_id) });

  const confirmarEliminar = async () => {
    if (!registroEliminar) return;
    const { tipo, item_id, item_na } = registroEliminar;
    const res = await runTx(TX_DE[tipo].delete, { item_id }, `"${item_na}" fue eliminado.`);
    setRegistroEliminar(null);
    if (res) recargar(tipo);
  };

  const handleGuardar = async () => {
    if (!form) return;
    if (!form.item_cod.trim() || !form.item_na.trim() || !form.category_id) {
      toast.error("Código, nombre y categoría son obligatorios.");
      return;
    }
    const params = { item_cod: Number(form.item_cod), item_na: form.item_na.trim(), category_id: Number(form.category_id) };
    const res = form.item_id
      ? await runTx(TX_DE[form.tipo].update, { item_id: form.item_id, ...params }, `"${params.item_na}" fue modificado correctamente.`)
      : await runTx(TX_DE[form.tipo].create, params, `"${params.item_na}" fue añadido.`);
    if (!res) return;
    recargar(form.tipo);
    setForm(null);
  };

  const counts = {
    total: registros.length,
    equipos: equipos.data?.length ?? 0,
    componentes: componentes.data?.length ?? 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-bold text-foreground">Mantenimiento de Inventario</h2>
        </div>
        <Button onClick={() => setForm({ ...registroVacio })} className="gap-2">
          <Plus className="w-4 h-4" /> Agregar Registro
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Package className="w-8 h-8 text-accent" />
            <div>
              <p className="text-2xl font-bold text-foreground">{counts.total}</p>
              <p className="text-sm text-muted-foreground">Total Registros</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Wrench className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{counts.equipos}</p>
              <p className="text-sm text-muted-foreground">Equipos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Package className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{counts.componentes}</p>
              <p className="text-sm text-muted-foreground">Componentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por código o nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-10" />
        </div>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="equipo">Equipos</SelectItem>
            <SelectItem value="componente">Componentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((reg) => (
                <TableRow key={`${reg.tipo}-${reg.item_id}`}>
                  <TableCell className="font-mono text-xs text-accent">{reg.item_cod}</TableCell>
                  <TableCell className="font-medium">{reg.item_na}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={reg.tipo === "equipo" ? "border-blue-500/30 text-blue-400" : "border-emerald-500/30 text-emerald-400"}>
                      {reg.tipo === "equipo" ? "Equipo" : "Componente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{categoriaDe(reg)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleEditar(reg)}>
                        <Pencil className="w-3 h-3 mr-1" /> Editar
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setRegistroEliminar(reg)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className={`text-center py-8 ${error ? "text-destructive" : "text-muted-foreground"}`}>
                    {loading ? "Cargando..." : error ?? "No se encontraron registros"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground text-right">Mostrando {filtered.length} de {registros.length} registros</p>

      {/* Create / Edit Dialog */}
      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form?.item_id ? "Editar Registro" : "Agregar Nuevo Registro"}</DialogTitle>
            <DialogDescription>
              {form?.item_id ? "Modifica las características del equipo o componente." : "Ingresa los datos del nuevo equipo o componente."}
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input type="number" min={1} value={form.item_cod} onChange={(e) => setForm({ ...form, item_cod: e.target.value })} placeholder="Ej: 1001" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={form.tipo}
                    disabled={!!form.item_id}
                    onValueChange={(v) => setForm({ ...form, tipo: v as Tipo, category_id: "" })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipo">Equipo</SelectItem>
                      <SelectItem value="componente">Componente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={form.item_na} onChange={(e) => setForm({ ...form, item_na: e.target.value })} placeholder="Nombre del equipo o componente" />
              </div>
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                  <SelectContent>
                    {categorias(form.tipo).map((c) => (
                      <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_de}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Cancelar</Button>
            <Button onClick={handleGuardar}>{form?.item_id ? "Guardar Cambios" : "Agregar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!registroEliminar} onOpenChange={(open) => !open && setRegistroEliminar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" /> Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar <strong>"{registroEliminar?.item_na}"</strong> ({registroEliminar?.item_cod})? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegistroEliminar(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarEliminar}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CategoriasPanel onChange={() => { catEquipos.reload(); catComponentes.reload(); }} />
    </div>
  );
};

export default MantenimientoModule;
