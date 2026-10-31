import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { BarChart3, Download, TrendingUp, Users, Package, AlertTriangle } from "lucide-react";
import BackButton from "@/components/BackButton";
import { TX } from "@/api/tx";
import { useTx } from "@/hooks/useTx";

interface Usuario { user_id: number; user_na: string }
interface Reporte<R, S> { data: R[]; summary: S }
type Vencidos = Reporte<{ user_id: number; loans_overdue: number; items_overdue: number }, { total_loans_overdue: number; total_items_overdue: number }>;
type SolvenciaRow = { user_id: number; active_loans: number; overdue_loans: number; borrowed_items: number; is_solvency_ok: boolean };
type Solvencia = Reporte<SolvenciaRow, { total_users: number; solvent_users: number; insolvent_users: number }>;
type Devoluciones = Reporte<unknown, { total_events: number; completed_events: number; partial_events: number; damaged_events: number }>;

const DIAS: Record<string, number> = { mensual: 30, trimestral: 90, anual: 365 };

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
};

const axisTick = { fill: "hsl(var(--muted-foreground))", fontSize: 12 };

function exportCsv(rows: SolvenciaRow[], nombre: (id: number) => string) {
  const lines = [
    "Usuario,Préstamos activos,Préstamos vencidos,Ítems prestados,Solvente",
    ...rows.map((r) => [`"${nombre(r.user_id)}"`, r.active_loans, r.overdue_loans, r.borrowed_items, r.is_solvency_ok ? "Sí" : "No"].join(",")),
  ];
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  link.download = "solvencia.csv";
  link.click();
}

interface Props {
  onBack: () => void;
}

const ReportesAdminModule = ({ onBack }: Props) => {
  const [periodo, setPeriodo] = useState("todo");
  const desde = useMemo(
    () => (DIAS[periodo] ? { from_dt: new Date(Date.now() - DIAS[periodo] * 86_400_000).toISOString() } : {}),
    [periodo],
  );
  const vencidos = useTx<Vencidos>(TX.report.create, { report_ty: "overdue_loans", ...desde });
  const solvencia = useTx<Solvencia>(TX.report.create, { report_ty: "solvency", ...desde });
  const devoluciones = useTx<Devoluciones>(TX.report.create, { report_ty: "devolution_stats", ...desde });
  const usuarios = useTx<Usuario[]>(TX.user.getAll);

  const nombre = (id: number) => usuarios.data?.find((u) => u.user_id === id)?.user_na ?? `#${id}`;
  const error = vencidos.error ?? solvencia.error ?? devoluciones.error;
  const sol = solvencia.data?.summary;
  const dev = devoluciones.data?.summary;
  const solvenciaRows = solvencia.data?.data ?? [];
  const prestamosPorUsuario = solvenciaRows.map((r) => ({ usuario: nombre(r.user_id), activos: r.active_loans, vencidos: r.overdue_loans }));
  const vencidosPorUsuario = (vencidos.data?.data ?? []).map((r) => ({ usuario: nombre(r.user_id), items: r.items_overdue }));
  const estadosDevolucion = [
    { nombre: "Completas", cantidad: dev?.completed_events ?? 0, fill: "hsl(140, 50%, 45%)" },
    { nombre: "Parciales", cantidad: dev?.partial_events ?? 0, fill: "hsl(45, 80%, 55%)" },
    { nombre: "Con daño", cantidad: dev?.damaged_events ?? 0, fill: "hsl(var(--destructive))" },
  ].filter((e) => e.cantidad > 0);

  const vacio = (texto: string) => <p className="text-sm text-muted-foreground text-center pt-24">{texto}</p>;

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Reportes y Estadísticas</h2>
            <p className="text-sm text-muted-foreground">Panel administrativo de métricas del sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">Todo</SelectItem>
              <SelectItem value="mensual">Último mes</SelectItem>
              <SelectItem value="trimestral">Último trimestre</SelectItem>
              <SelectItem value="anual">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" disabled={!solvenciaRows.length} onClick={() => exportCsv(solvenciaRows, nombre)}>
            <Download className="w-4 h-4 mr-2" />Exportar
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="w-5 h-5 text-primary" /><div><p className="text-2xl font-bold text-foreground">{vencidos.data?.summary.total_loans_overdue ?? 0}</p><p className="text-xs text-muted-foreground">Préstamos Vencidos</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Package className="w-5 h-5 text-accent" /><div><p className="text-2xl font-bold text-foreground">{dev?.total_events ?? 0}</p><p className="text-xs text-muted-foreground">Devoluciones Registradas</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Users className="w-5 h-5 text-primary" /><div><p className="text-2xl font-bold text-foreground">{sol?.solvent_users ?? 0} / {sol?.total_users ?? 0}</p><p className="text-xs text-muted-foreground">Usuarios Solventes</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-destructive" /><div><p className="text-2xl font-bold text-foreground">{dev?.damaged_events ?? 0}</p><p className="text-xs text-muted-foreground">Devoluciones con Daño</p></div></CardContent></Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Préstamos Activos vs Vencidos por Usuario</h3>
          <div className="h-72">
            {prestamosPorUsuario.length === 0 ? vacio("Sin préstamos en el período") : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prestamosPorUsuario}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="usuario" tick={axisTick} />
                  <YAxis allowDecimals={false} tick={axisTick} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="activos" name="Activos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="vencidos" name="Vencidos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Estado de las Devoluciones</h3>
          <div className="h-72">
            {estadosDevolucion.length === 0 ? vacio("Sin devoluciones en el período") : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={estadosDevolucion} dataKey="cantidad" nameKey="nombre" cx="50%" cy="50%" outerRadius={90} label={({ nombre, percent }) => `${nombre} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: "hsl(var(--muted-foreground))" }}>
                    {estadosDevolucion.map((e) => <Cell key={e.nombre} fill={e.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend formatter={v => <span className="text-muted-foreground">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-foreground mb-4">Ítems Vencidos por Usuario</h3>
          <div className="h-72">
            {vencidosPorUsuario.length === 0 ? vacio("Sin préstamos vencidos") : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vencidosPorUsuario}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="usuario" tick={axisTick} />
                  <YAxis allowDecimals={false} tick={axisTick} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="items" name="Ítems" fill="hsl(45, 80%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReportesAdminModule;
