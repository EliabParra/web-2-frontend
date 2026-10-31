import { useState } from "react";
import { Input } from "@/components/ui/input";
import { IntegerInput } from "@/components/ui/integer-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, Filter, Download, Plus, Pencil, PackagePlus, Trash2 } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TX } from "@/api/tx";
import { runTx, useTx } from "@/hooks/useTx";

// Category types seeded by the backend: 1 = "Equipo", 2 = "Componente".
type Tipo = "equipo" | "componente";
const TIPO_DE_CATEGORIA: Record<number, Tipo> = { 1: "equipo", 2: "componente" };
const TX_DE = { equipo: TX.equipment, componente: TX.component } as const;
const NUEVO: Record<Tipo, string> = { componente: "new:componente", equipo: "new:equipo" };
const esNuevo = (itemId: string) => itemId.startsWith("new:");

interface InventarioRow {
  inventory_id: number;
  inventory_qt: number;
  item_id: number;
  item_cod: string;
  item_na: string;
  location_id: number;
  location_de: string;
  location_sh: number;
  location_dr: number;
  category_type_id: number;
}
interface Item { item_id: number; item_cod: string; item_na: string; category_id: number; tipo: Tipo }
interface Categoria { category_id: number; category_de: string; category_type_id: number }
interface Ubicacion { location_id: number; location_de: string; location_sh: number; location_dr: number }

type Estado = "disponible" | "agotado";
type Form = {
  tipo: Tipo;
  item_id: string;
  item_cod: string;
  item_na: string;
  category_id: string;
  location_id: string;
  inventory_qt: string;
};
type DialogState =
  | { mode: "create" | "edit"; row?: InventarioRow; form: Form }
  | { mode: "stock"; row: InventarioRow; quantity: string };

const estadoBadge: Record<Estado, string> = {
  disponible: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  agotado: "bg-red-500/20 text-red-400 border-red-500/30",
};

const estadoDe = (row: InventarioRow): Estado => (row.inventory_qt > 0 ? "disponible" : "agotado");
const ubicacionDe = (u: Ubicacion) => `${u.location_de} (E${u.location_sh}-G${u.location_dr})`;

const emptyForm: Form = { tipo: "componente", item_id: NUEVO.componente, item_cod: "", item_na: "", category_id: "", location_id: "", inventory_qt: "1" };

function exportCsv(rows: InventarioRow[]) {
  const lines = [
    "Código,Ítem,Tipo,Cantidad,Ubicación",
    ...rows.map((r) => [`"${r.item_cod}"`, `"${r.item_na}"`, TIPO_DE_CATEGORIA[r.category_type_id] ?? "", r.inventory_qt, `"${ubicacionDe(r)}"`].join(",")),
  ];
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  link.download = "inventario.csv";
  link.click();
}

const InventarioModule = () => {
  const inventario = useTx<InventarioRow[]>(TX.inventory.getAll);
  const componentes = useTx<Omit<Item, "tipo">[]>(TX.component.getAll);
  const equipos = useTx<Omit<Item, "tipo">[]>(TX.equipment.getAll);
  const categorias = useTx<Categoria[]>(TX.category.getAll);
  const ubicaciones = useTx<Ubicacion[]>(TX.location.getAll);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const rows = inventario.data ?? [];
  const items: Item[] = [
    ...(componentes.data ?? []).map((i) => ({ ...i, tipo: "componente" as const })),
    ...(equipos.data ?? []).map((i) => ({ ...i, tipo: "equipo" as const })),
  ];
  const filtered = rows.filter((item) => {
    const text = `${item.item_na} ${item.item_cod}`.toLowerCase();
    return (
      text.includes(search.toLowerCase()) &&
      (filtroEstado === "todos" || estadoDe(item) === filtroEstado) &&
      (filtroTipo === "todos" || TIPO_DE_CATEGORIA[item.category_type_id] === filtroTipo)
    );
  });

  const reloadAll = () => {
    inventario.reload();
    componentes.reload();
    equipos.reload();
  };
  const close = () => setDialog(null);

  const openEdit = (row: InventarioRow) => {
    const item = items.find((c) => c.item_id === row.item_id);
    setDialog({
      mode: "edit",
      row,
      form: {
        tipo: TIPO_DE_CATEGORIA[row.category_type_id] ?? "componente",
        item_id: String(row.item_id),
        item_cod: String(row.item_cod),
        item_na: row.item_na,
        category_id: String(item?.category_id ?? ""),
        location_id: String(row.location_id),
        inventory_qt: String(row.inventory_qt),
      },
    });
  };

  const saveItem = async (form: Form): Promise<number | undefined> => {
    const fields = { item_cod: form.item_cod.trim(), item_na: form.item_na, category_id: form.category_id };
    const nombre = form.tipo === "equipo" ? "Equipo" : "Componente";
    if (esNuevo(form.item_id)) {
      const created = await runTx<Item>(TX_DE[form.tipo].create, fields, `${nombre} creado`);
      return created?.data.item_id;
    }
    const updated = await runTx(TX_DE[form.tipo].update, { item_id: form.item_id, ...fields }, `${nombre} actualizado`);
    return updated && Number(form.item_id);
  };

  const saveForm = async () => {
    if (dialog?.mode !== "create" && dialog?.mode !== "edit") return;
    const { form, row } = dialog;
    const isNewOrEdited = esNuevo(form.item_id) || dialog.mode === "edit";
    const itemId = isNewOrEdited ? await saveItem(form) : Number(form.item_id);
    if (!itemId) return;

    const ok = row
      ? await runTx(TX.inventory.update, { inventory_id: row.inventory_id, inventory_qt: form.inventory_qt, location_id: form.location_id }, "Inventario actualizado")
      : await runTx(TX.inventory.create, { item_id: itemId, location_id: form.location_id, inventory_qt: form.inventory_qt }, "Inventario registrado");
    if (!ok) return;
    close();
    reloadAll();
  };

  const changeStock = async (txId: number, message: string) => {
    if (dialog?.mode !== "stock") return;
    if (!(await runTx(txId, { inventory_id: dialog.row.inventory_id, quantity: dialog.quantity }, message))) return;
    close();
    reloadAll();
  };

  const darDeBaja = async (row: InventarioRow) => {
    if (!window.confirm(`¿Dar de baja "${row.item_na}"? Su cantidad quedará en 0.`)) return;
    if (await runTx(TX.inventory.delete, { inventory_id: row.inventory_id }, "Inventario dado de baja")) reloadAll();
  };

  const setField = (field: keyof Form, value: string) =>
    dialog && dialog.mode !== "stock" && setDialog({ ...dialog, form: { ...dialog.form, [field]: value } });

  const form = dialog && dialog.mode !== "stock" ? dialog.form : null;
  const showComponentFields = form && (esNuevo(form.item_id) || dialog?.mode === "edit");
  const elegirItem = (value: string) => {
    if (!form || dialog?.mode === "stock" || !dialog) return;
    const tipo = esNuevo(value) ? (value.slice(4) as Tipo) : items.find((i) => String(i.item_id) === value)?.tipo ?? form.tipo;
    setDialog({ ...dialog, form: { ...form, item_id: value, tipo, category_id: tipo === form.tipo ? form.category_id : "" } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Inventario</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCsv(filtered)}>
            <Download className="w-4 h-4" /> Exportar
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setDialog({ mode: "create", form: emptyForm })}>
            <Plus className="w-4 h-4" /> Nuevo
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="componente">Componentes</SelectItem>
            <SelectItem value="equipo">Equipos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="disponible">Disponible</SelectItem>
            <SelectItem value="agotado">Agotado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {inventario.error && <p className="text-destructive text-sm">{inventario.error}</p>}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead>Código</TableHead>
              <TableHead>Ítem</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-center">Cantidad</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.inventory_id} className="border-border">
                <TableCell className="font-mono text-accent">{item.item_cod}</TableCell>
                <TableCell className="font-medium">{item.item_na}</TableCell>
                <TableCell>
                  <Badge variant="outline">{TIPO_DE_CATEGORIA[item.category_type_id] === "equipo" ? "Equipo" : "Componente"}</Badge>
                </TableCell>
                <TableCell className="text-center">{item.inventory_qt}</TableCell>
                <TableCell className="text-muted-foreground">{ubicacionDe(item)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={estadoBadge[estadoDe(item)]}>
                    {estadoDe(item) === "disponible" ? "Disponible" : "Agotado"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Stock" onClick={() => setDialog({ mode: "stock", row: item, quantity: "1" })}>
                    <PackagePlus className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Editar" onClick={() => openEdit(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="Dar de baja" onClick={() => darDeBaja(item)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!inventario.loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No se encontraron registros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground text-right">
        Mostrando {filtered.length} de {rows.length} registros
      </p>

      <Dialog open={form !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "edit" ? "Editar inventario" : "Registrar en inventario"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              {dialog?.mode === "create" && (
                <div className="space-y-2">
                  <Label>Ítem</Label>
                  <Select value={form.item_id} onValueChange={elegirItem}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NUEVO.componente}>+ Nuevo componente</SelectItem>
                      <SelectItem value={NUEVO.equipo}>+ Nuevo equipo</SelectItem>
                      {items.map((c) => (
                        <SelectItem key={c.item_id} value={String(c.item_id)}>
                          {c.item_cod} — {c.item_na} ({c.tipo === "equipo" ? "Equipo" : "Componente"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {showComponentFields && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item_cod">Código</Label>
                      <Input id="item_cod" maxLength={50} value={form.item_cod} onChange={(e) => setField("item_cod", e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="item_na">Nombre</Label>
                      <Input id="item_na" value={form.item_na} onChange={(e) => setField("item_na", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={form.category_id} onValueChange={(v) => setField("category_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Seleccione una categoría" /></SelectTrigger>
                      <SelectContent>
                        {categorias.data?.filter((c) => TIPO_DE_CATEGORIA[c.category_type_id] === form.tipo).map((c) => (
                          <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_de}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Ubicación</Label>
                  <Select value={form.location_id} onValueChange={(v) => setField("location_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccione una ubicación" /></SelectTrigger>
                    <SelectContent>
                      {ubicaciones.data?.map((u) => (
                        <SelectItem key={u.location_id} value={String(u.location_id)}>{ubicacionDe(u)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inventory_qt">Cantidad</Label>
                  <IntegerInput id="inventory_qt" min={0} value={form.inventory_qt} onChange={(e) => setField("inventory_qt", e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancelar</Button>
            <Button onClick={saveForm}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog?.mode === "stock"} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock: {dialog?.row?.item_na}</DialogTitle>
          </DialogHeader>
          {dialog?.mode === "stock" && (
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad (actual: {dialog.row.inventory_qt})</Label>
              <IntegerInput id="quantity" min={1} value={dialog.quantity} onChange={(e) => setDialog({ ...dialog, quantity: e.target.value })} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => changeStock(TX.inventory.removeStock, "Stock retirado")}>Retirar</Button>
            <Button onClick={() => changeStock(TX.inventory.addStock, "Stock agregado")}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventarioModule;
