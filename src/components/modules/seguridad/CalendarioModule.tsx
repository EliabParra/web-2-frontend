import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Plus, Edit, Trash2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import { TX } from "@/api/tx";
import { runTx, useTx } from "@/hooks/useTx";

interface Lapso {
  lapse_id: number;
  lapse_de: string;
  lapse_act: boolean | null;
  lapse_start_dt: string | null;
  lapse_close_dt: string | null;
}

type LapseForm = { lapse_id?: number; lapse_de: string; lapse_act: "true" | "false"; lapse_start_dt: string; lapse_close_dt: string };

const emptyForm: LapseForm = { lapse_de: "", lapse_act: "false", lapse_start_dt: "", lapse_close_dt: "" };

const toDateInput = (value: string | null) => (value ? value.slice(0, 10) : "");

const CalendarioModule = ({ onBack }: { onBack: () => void }) => {
  const { data, loading, error, reload } = useTx<Lapso[]>(TX.lapse.getAll);
  const [form, setForm] = useState<LapseForm | null>(null);

  const lapsos = data ?? [];

  const handleSave = async () => {
    if (!form) return;
    const { lapse_id, ...fields } = form;
    const params = {
      lapse_de: fields.lapse_de,
      lapse_act: fields.lapse_act === "true",
      lapse_start_dt: fields.lapse_start_dt || null,
      lapse_close_dt: fields.lapse_close_dt || null,
    };
    const ok = lapse_id
      ? await runTx(TX.lapse.update, { lapse_id, ...params }, "Periodo actualizado")
      : await runTx(TX.lapse.create, params, "Periodo creado");
    if (!ok) return;
    setForm(null);
    reload();
  };

  const handleDelete = async (l: Lapso) => {
    if (!window.confirm(`¿Eliminar el periodo "${l.lapse_de}"?`)) return;
    if (await runTx(TX.lapse.delete, { lapse_id: l.lapse_id }, "Periodo eliminado")) reload();
  };

  const openEdit = (l: Lapso) =>
    setForm({
      lapse_id: l.lapse_id,
      lapse_de: l.lapse_de,
      lapse_act: l.lapse_act ? "true" : "false",
      lapse_start_dt: toDateInput(l.lapse_start_dt),
      lapse_close_dt: toDateInput(l.lapse_close_dt),
    });

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-bold text-foreground">Calendario Académico</h2>
        </div>
        <Button size="sm" onClick={() => setForm(emptyForm)}><Plus className="w-4 h-4 mr-1" /> Nuevo Periodo</Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lapsos.map((l) => (
          <Card key={l.lapse_id} className="hover:border-accent transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-foreground">{l.lapse_de}</h3>
                <Badge variant="outline" className={l.lapse_act ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-secondary text-secondary-foreground"}>
                  {l.lapse_act ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 mb-3">
                <p>Inicio: <span className="text-foreground">{toDateInput(l.lapse_start_dt) || "—"}</span></p>
                <p>Fin: <span className="text-foreground">{toDateInput(l.lapse_close_dt) || "—"}</span></p>
              </div>
              <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(l)} aria-label="Editar"><Edit className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(l)} className="text-destructive hover:text-destructive" aria-label="Eliminar"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && lapsos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No hay periodos registrados.</div>
      )}

      <Dialog open={form !== null} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form?.lapse_id ? "Editar Periodo" : "Nuevo Periodo"}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Descripción</Label><Input value={form.lapse_de} onChange={(e) => setForm({ ...form, lapse_de: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.lapse_act} onValueChange={(v) => setForm({ ...form, lapse_act: v as LapseForm["lapse_act"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Fecha Inicio</Label><Input type="date" value={form.lapse_start_dt} onChange={(e) => setForm({ ...form, lapse_start_dt: e.target.value })} /></div>
                <div className="space-y-2"><Label>Fecha Fin</Label><Input type="date" value={form.lapse_close_dt} onChange={(e) => setForm({ ...form, lapse_close_dt: e.target.value })} /></div>
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

export default CalendarioModule;
