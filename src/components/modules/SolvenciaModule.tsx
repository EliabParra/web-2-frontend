import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CheckCircle, AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TX } from "@/api/tx";
import { useTx } from "@/hooks/useTx";
import { useAuth } from "@/contexts/AuthContext";
import { estadoPrestamo, fecha, type PrestamoResumen } from "./DevolucionesModule";

const estadoConfig: Record<ReturnType<typeof estadoPrestamo>, { icon: React.ReactNode; class: string; label: string }> = {
  activo: { icon: <Clock className="w-3.5 h-3.5" />, class: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "Activo" },
  vencido: { icon: <AlertTriangle className="w-3.5 h-3.5" />, class: "bg-red-500/20 text-red-400 border-red-500/30", label: "Vencido" },
  devuelto: { icon: <CheckCircle className="w-3.5 h-3.5" />, class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Devuelto" },
};

const SolvenciaModule = () => {
  const { user } = useAuth();
  const { data, loading, error } = useTx<PrestamoResumen[]>(TX.devolution.getUserDevolution, { user_id: user?.user_id });

  const prestamos = data ?? [];
  const contar = (estado: string) => prestamos.filter((p) => estadoPrestamo(p) === estado).length;
  const activos = contar("activo");
  const vencidos = contar("vencido");
  const devueltos = contar("devuelto");
  const esSolvente = vencidos === 0 && activos === 0;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-foreground">Estado de Solvencia</h2>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Status card */}
      {!loading && !error && (
        <Card className={`border-2 ${esSolvente ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
          <CardHeader className="pb-2 flex-row items-center gap-3 space-y-0">
            <ShieldCheck className={`w-8 h-8 ${esSolvente ? "text-emerald-400" : "text-amber-400"}`} />
            <div>
              <CardTitle className="text-lg">
                {esSolvente ? "Solvente" : "No Solvente"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {esSolvente
                  ? "No tienes préstamos pendientes. Puedes solicitar nuevos componentes."
                  : `Tienes ${activos} préstamo(s) activo(s) y ${vencidos} vencido(s). Devuélvelos para estar solvente.`}
              </p>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{activos}</p>
            <p className="text-xs text-muted-foreground mt-1">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-red-400">{vencidos}</p>
            <p className="text-xs text-muted-foreground mt-1">Vencidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{devueltos}</p>
            <p className="text-xs text-muted-foreground mt-1">Devueltos</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead>ID</TableHead>
              <TableHead className="text-center">Ítems</TableHead>
              <TableHead>Préstamo</TableHead>
              <TableHead>Límite</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prestamos.map((p) => {
              const cfg = estadoConfig[estadoPrestamo(p)];
              return (
                <TableRow key={p.movement_id} className="border-border">
                  <TableCell className="font-mono text-accent">{p.movement_id}</TableCell>
                  <TableCell className="text-center">{p.total_items}</TableCell>
                  <TableCell className="text-muted-foreground">{fecha(p.movement_booking_dt)}</TableCell>
                  <TableCell className="text-muted-foreground">{fecha(p.movement_estimated_return_dt)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`gap-1 ${cfg.class}`}>
                      {cfg.icon} {cfg.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && prestamos.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No tienes préstamos registrados</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SolvenciaModule;
