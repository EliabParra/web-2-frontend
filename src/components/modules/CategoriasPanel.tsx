import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { toast } from "sonner";
import { TX } from "@/api/tx";
import { runTx, useTx } from "@/hooks/useTx";

// Category types seeded by the backend: 1 = "Equipo", 2 = "Componente".
const TIPOS: Record<string, string> = { "1": "Equipo", "2": "Componente" };

interface Categoria { category_id: number; category_de: string; category_type_id: number }
type Form = { category_id?: number; category_de: string; category_type_id: string };

const CategoriasPanel = ({ onChange }: { onChange: () => void }) => {
  const categorias = useTx<Categoria[]>(TX.category.getAll);
  const [form, setForm] = useState<Form | null>(null);

  const recargar = () => {
    categorias.reload();
    onChange();
  };

  const guardar = async () => {
    if (!form) return;
    if (!form.category_de.trim() || !form.category_type_id) {
      toast.error("Nombre y tipo son obligatorios.");
      return;
    }
    const params = { category_de: form.category_de.trim(), category_type_id: Number(form.category_type_id) };
    const res = form.category_id
      ? await runTx(TX.category.update, { category_id: form.category_id, ...params }, "Categoría modificada.")
      : await runTx(TX.category.create, params, "Categoría creada.");
    if (!res) return;
    setForm(null);
    recargar();
  };

  const eliminar = async (c: Categoria) => {
    if (await runTx(TX.category.delete, { category_id: c.category_id }, `"${c.category_de}" fue eliminada.`)) recargar();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Tags className="w-5 h-5 text-accent" /> Categorías
        </CardTitle>
        <Button size="sm" className="gap-2" onClick={() => setForm({ category_de: "", category_type_id: "2" })}>
          <Plus className="w-4 h-4" /> Nueva categoría
        </Button>
      </CardHeader>
      <CardContent>
        {categorias.error && <p className="text-sm text-destructive">{categorias.error}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(categorias.data ?? []).map((c) => (
              <TableRow key={c.category_id}>
                <TableCell>{c.category_de}</TableCell>
                <TableCell><Badge variant="outline">{TIPOS[String(c.category_type_id)] ?? "—"}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setForm({ category_id: c.category_id, category_de: c.category_de, category_type_id: String(c.category_type_id) })}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => eliminar(c)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!categorias.loading && !categorias.data?.length && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Aún no hay categorías. Crea una antes de registrar equipos o componentes.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.category_id ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={form.category_de} onChange={(e) => setForm({ ...form, category_de: e.target.value })} placeholder="Ej: Pasivo" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.category_type_id} onValueChange={(v) => setForm({ ...form, category_type_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPOS).map(([id, nombre]) => (
                      <SelectItem key={id} value={id}>{nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Cancelar</Button>
            <Button onClick={guardar}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CategoriasPanel;
