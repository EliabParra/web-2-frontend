import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Settings, Search, Edit, Plus, Trash2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import { TX } from "@/api/tx";
import { runTx, useTx } from "@/hooks/useTx";

interface Subsistema {
  subsystem_id: number;
  subsystem_na: string;
}

type SubsystemForm = { subsystem_id?: number; subsystem_na: string };

const SubsistemaModule = ({ onBack }: { onBack: () => void }) => {
  const { data, loading, error, reload } = useTx<Subsistema[]>(TX.subsystem.getAll);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState<SubsystemForm | null>(null);

  const subsistemas = data ?? [];
  const filtered = subsistemas.filter((s) => s.subsystem_na.toLowerCase().includes(busqueda.toLowerCase()));

  const handleSave = async () => {
    if (!form) return;
    const ok = form.subsystem_id
      ? await runTx(TX.subsystem.update, form, "Subsistema actualizado")
      : await runTx(TX.subsystem.create, { subsystem_na: form.subsystem_na }, "Subsistema creado");
    if (!ok) return;
    setForm(null);
    reload();
  };

  const handleDelete = async (s: Subsistema) => {
    if (!window.confirm(`¿Eliminar el subsistema "${s.subsystem_na}"?`)) return;
    if (await runTx(TX.subsystem.delete, { subsystem_id: s.subsystem_id }, "Subsistema eliminado")) reload();
  };

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-bold text-foreground">Subsistemas</h2>
        </div>
        <Button size="sm" onClick={() => setForm({ subsystem_na: "" })}><Plus className="w-4 h-4 mr-1" /> Nuevo Subsistema</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold text-foreground">{subsistemas.length}</p></CardContent></Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar subsistema..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-10" />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.subsystem_id}>
                  <TableCell className="font-mono text-xs">{s.subsystem_id}</TableCell>
                  <TableCell className="font-medium">{s.subsystem_na}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => setForm({ ...s })} aria-label="Editar"><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(s)} className="text-destructive hover:text-destructive" aria-label="Eliminar"><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No se encontraron subsistemas</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={form !== null} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form?.subsystem_id ? "Editar Subsistema" : "Nuevo Subsistema"}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-2 py-2">
              <Label>Nombre</Label>
              <Input value={form.subsystem_na} onChange={(e) => setForm({ ...form, subsystem_na: e.target.value })} />
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

export default SubsistemaModule;
