import { useState } from "react";
import { MapPin, Search, Layers, Box, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { TX } from "@/api/tx";
import { runTx, useTx } from "@/hooks/useTx";

interface Ubicacion {
  location_id: number;
  location_de: string;
  location_sh: number;
  location_dr: number;
}

type LocationForm = { location_id?: number; location_de: string; location_sh: string; location_dr: string };

const emptyForm: LocationForm = { location_de: "", location_sh: "", location_dr: "" };

const UbicacionModule = () => {
  const { data, loading, error, reload } = useTx<Ubicacion[]>(TX.location.getAll);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState<LocationForm | null>(null);

  const ubicaciones = data ?? [];
  const filtered = ubicaciones.filter((u) => u.location_de.toLowerCase().includes(busqueda.toLowerCase()));
  const estantes = new Set(ubicaciones.map((u) => u.location_sh)).size;

  const save = async () => {
    if (!form) return;
    const { location_id, ...fields } = form;
    const ok = location_id
      ? await runTx(TX.location.update, { location_id, ...fields }, "Ubicación actualizada")
      : await runTx(TX.location.create, fields, "Ubicación creada");
    if (!ok) return;
    setForm(null);
    reload();
  };

  const remove = async (u: Ubicacion) => {
    if (!window.confirm(`¿Eliminar la ubicación "${u.location_de}"?`)) return;
    if (await runTx(TX.location.delete, { location_id: u.location_id }, "Ubicación eliminada")) reload();
  };

  const edit = (u: Ubicacion) =>
    setForm({ location_id: u.location_id, location_de: u.location_de, location_sh: String(u.location_sh), location_dr: String(u.location_dr) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Ubicación de Componentes</h2>
          <p className="text-sm text-muted-foreground">Localización física de componentes en los laboratorios</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setForm(emptyForm)}>
          <Plus className="w-4 h-4" /> Nueva ubicación
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Box className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Ubicaciones</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{ubicaciones.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-emerald-400" />
            <p className="text-sm text-muted-foreground">Estantes</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{estantes}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ubicación..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-9 bg-card border-border"
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Location cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((u) => (
          <div key={u.location_id} className="bg-card border border-border rounded-xl p-4 hover:border-accent transition-colors">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-foreground text-sm">{u.location_de}</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => edit(u)} aria-label="Editar">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(u)} aria-label="Eliminar">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>Estante {u.location_sh} → Gaveta {u.location_dr}</span>
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No se encontraron ubicaciones.</div>
      )}

      <Dialog open={form !== null} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.location_id ? "Editar ubicación" : "Nueva ubicación"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location_de">Descripción</Label>
                <Input id="location_de" value={form.location_de} onChange={(e) => setForm({ ...form, location_de: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location_sh">Estante</Label>
                  <Input id="location_sh" type="number" min={1} value={form.location_sh} onChange={(e) => setForm({ ...form, location_sh: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location_dr">Gaveta</Label>
                  <Input id="location_dr" type="number" min={1} value={form.location_dr} onChange={(e) => setForm({ ...form, location_dr: e.target.value })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UbicacionModule;
