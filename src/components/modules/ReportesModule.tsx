import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TX } from "@/api/tx";
import { useTx } from "@/hooks/useTx";

// Report catalog ids in the backend's ReportRepository.
const OVERDUE = { id: 1 };
const SOLVENCY = { id: 2 };
const DEVOLUTIONS = { id: 3 };

interface Reporte<R, S> { data: R[]; summary: S }
type Vencidos = Reporte<{ user_id: number; loans_overdue: number }, { total_loans_overdue: number; total_items_overdue: number }>;
type Solvencia = Reporte<unknown, { total_users: number; insolvent_users: number }>;
type Devoluciones = Reporte<unknown, { total_events: number; completed_events: number; partial_events: number; damaged_events: number }>;


const tooltipStyle = {
  backgroundColor: "hsl(216, 45%, 12%)",
  border: "1px solid hsl(216, 30%, 22%)",
  borderRadius: "8px",
  color: "hsl(210, 40%, 98%)",
};

const ReportesModule = () => {
  const vencidos = useTx<Vencidos>(TX.report.get, OVERDUE);
  const solvencia = useTx<Solvencia>(TX.report.get, SOLVENCY);
  const devoluciones = useTx<Devoluciones>(TX.report.get, DEVOLUTIONS);

  const error = vencidos.error ?? solvencia.error ?? devoluciones.error;
  const porUsuario = (vencidos.data?.data ?? []).map((r) => ({ usuario: `#${r.user_id}`, prestamos: r.loans_overdue }));
  const dev = devoluciones.data?.summary;
  const estadosDevolucion = [
    { nombre: "Completas", cantidad: dev?.completed_events ?? 0, fill: "hsl(140, 50%, 45%)" },
    { nombre: "Parciales", cantidad: dev?.partial_events ?? 0, fill: "hsl(45, 80%, 55%)" },
    { nombre: "Con daño", cantidad: dev?.damaged_events ?? 0, fill: "hsl(340, 65%, 50%)" },
  ].filter((e) => e.cantidad > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Reportes</h2>
        <p className="text-sm text-muted-foreground">Estadísticas de préstamos y devoluciones</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Préstamos vencidos</p>
          <p className="text-2xl font-bold text-foreground">{vencidos.data?.summary.total_loans_overdue ?? 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Usuarios no solventes</p>
          <p className="text-2xl font-bold text-foreground">
            {solvencia.data?.summary.insolvent_users ?? 0} / {solvencia.data?.summary.total_users ?? 0}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Devoluciones registradas</p>
          <p className="text-2xl font-bold text-foreground">{dev?.total_events ?? 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Préstamos Vencidos por Usuario</h3>
          <div className="h-72">
            {porUsuario.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center pt-24">Sin préstamos vencidos</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porUsuario}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 30%, 22%)" />
                  <XAxis dataKey="usuario" tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="prestamos" name="Préstamos" fill="hsl(213, 80%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Estado de las Devoluciones</h3>
          <div className="h-72">
            {estadosDevolucion.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center pt-24">Sin devoluciones registradas</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadosDevolucion}
                    dataKey="cantidad"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ nombre, percent }) => `${nombre} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "hsl(215, 20%, 65%)" }}
                  >
                    {estadosDevolucion.map((e) => (
                      <Cell key={e.nombre} fill={e.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend formatter={(value) => <span style={{ color: "hsl(215, 20%, 65%)" }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesModule;
