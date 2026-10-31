import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HandCoins, Search, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { TX } from "@/api/tx";
import { useTx } from "@/hooks/useTx";
import { useAuth } from "@/contexts/AuthContext";
import { estadoPrestamo, fecha, type PrestamoResumen } from "./DevolucionesModule";

const estadoBadge: Record<string, { variant: "default" | "destructive" | "secondary"; label: string }> = {
  activo: { variant: "default", label: "Activo" },
  vencido: { variant: "destructive", label: "Vencido" },
  devuelto: { variant: "secondary", label: "Devuelto" },
};

const PrestamosModule = () => {
  const { user } = useAuth();
  const { data, loading, error } = useTx<PrestamoResumen[]>(TX.devolution.getUserDevolution, { user_id: user?.user_id });
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<string>("todos");

  const prestamos = data ?? [];
  const filtered = prestamos.filter((p) => {
    const matchSearch = String(p.movement_id).includes(search);
    const matchFiltro = filtro === "todos" || estadoPrestamo(p) === filtro;
    return matchSearch && matchFiltro;
  });

  const contar = (estado: string) => prestamos.filter((p) => estadoPrestamo(p) === estado).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HandCoins className="w-7 h-7 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Mis Préstamos</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="w-5 h-5 text-primary" /><div><p className="text-2xl font-bold text-foreground">{contar("activo")}</p><p className="text-xs text-muted-foreground">Activos</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-destructive" /><div><p className="text-2xl font-bold text-foreground">{contar("vencido")}</p><p className="text-xs text-muted-foreground">Vencidos</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-accent" /><div><p className="text-2xl font-bold text-foreground">{contar("devuelto")}</p><p className="text-xs text-muted-foreground">Devueltos</p></div></CardContent></Card>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">Historial de Préstamos</CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {["todos", "activo", "vencido", "devuelto"].map((f) => (
                  <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filtro === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por ID..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Ítems</TableHead>
                <TableHead>Pendientes</TableHead>
                <TableHead>Fecha Préstamo</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const badge = estadoBadge[estadoPrestamo(p)];
                return (
                  <TableRow key={p.movement_id}>
                    <TableCell className="font-mono text-xs">{p.movement_id}</TableCell>
                    <TableCell>{p.total_items}</TableCell>
                    <TableCell>{p.pending_items}</TableCell>
                    <TableCell>{fecha(p.movement_booking_dt)}</TableCell>
                    <TableCell>{fecha(p.movement_estimated_return_dt)}</TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No se encontraron préstamos</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrestamosModule;
