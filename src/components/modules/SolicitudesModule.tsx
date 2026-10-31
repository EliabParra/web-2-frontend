import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IntegerInput } from "@/components/ui/integer-input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { TX } from "@/api/tx";
import { runTx, useTx } from "@/hooks/useTx";
import { useAuth } from "@/contexts/AuthContext";

/** Loan request as returned by Loan.getAllRequests (dates arrive already formatted "dd/mm/yyyy, hh:mm:ss"). */
export interface Solicitud {
  movement_id: number;
  user_id: number;
  movement_ob: string | null;
  movement_booking_dt: string | null;
  movement_estimated_return_dt: string | null;
  movement_type_id: number;
  total_items: number;
}

interface InventarioRow {
  inventory_id: number;
  inventory_qt: number;
  item_na: string;
  location_de: string;
}

type Estado = "pendiente" | "aprobada" | "rechazada";

// Movement types 1-3 of the backend seed: Solicitado, Aceptado, Rechazado.
export const estadoSolicitud: Record<number, Estado> = { 1: "pendiente", 2: "aprobada", 3: "rechazada" };

export const fechaCorta = (v: string | null) => v?.split(",")[0] || "—";

const estadoConfig: Record<Estado, { icon: React.ReactNode; class: string }> = {
  pendiente: { icon: <Clock className="w-3.5 h-3.5" />, class: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  aprobada: { icon: <CheckCircle className="w-3.5 h-3.5" />, class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  rechazada: { icon: <XCircle className="w-3.5 h-3.5" />, class: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const SolicitudesModule = () => {
  const { user } = useAuth();
  const { data, loading, error, reload } = useTx<Solicitud[]>(TX.loan.getAllRequests);
  const inventario = useTx<InventarioRow[]>(TX.inventory.getAll);
  const [inventoryId, setInventoryId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [motivo, setMotivo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const disponibles = (inventario.data ?? []).filter((i) => i.inventory_qt > 0);

  const handleSubmit = async () => {
    if (!inventoryId || !motivo) {
      toast.error("Complete todos los campos.");
      return;
    }
    const ok = await runTx(
      TX.loan.requestLoan,
      {
        user_id: user?.user_id,
        movement_ob: motivo,
        details: [{ inventory_id: inventoryId, movement_detail_am: cantidad }],
      },
      "Solicitud enviada",
    );
    if (!ok) return;
    setInventoryId("");
    setCantidad("1");
    setMotivo("");
    setDialogOpen(false);
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Mis Solicitudes</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Solicitar Préstamo de Componente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Componente</Label>
                <Select value={inventoryId} onValueChange={setInventoryId}>
                  <SelectTrigger><SelectValue placeholder="Seleccione un componente" /></SelectTrigger>
                  <SelectContent>
                    {disponibles.map((i) => (
                      <SelectItem key={i.inventory_id} value={String(i.inventory_id)}>
                        {i.item_na} — {i.location_de} (disp: {i.inventory_qt})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <IntegerInput min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Textarea
                  placeholder="Describa el motivo del préstamo..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleSubmit}>Enviar Solicitud</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead>ID</TableHead>
              <TableHead className="text-center">Ítems</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((sol) => {
              const estado = estadoSolicitud[sol.movement_type_id] ?? "pendiente";
              const cfg = estadoConfig[estado];
              return (
                <TableRow key={sol.movement_id} className="border-border">
                  <TableCell className="font-mono text-accent">{sol.movement_id}</TableCell>
                  <TableCell className="text-center">{sol.total_items}</TableCell>
                  <TableCell className="text-muted-foreground">{fechaCorta(sol.movement_booking_dt)}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{sol.movement_ob}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`gap-1 ${cfg.class}`}>
                      {cfg.icon}
                      {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && (data ?? []).length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No tienes solicitudes</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SolicitudesModule;
