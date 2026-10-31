import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Waypoints, Search } from "lucide-react";
import BackButton from "@/components/BackButton";
import { TX } from "@/api/tx";
import { useTx } from "@/hooks/useTx";

interface Metodo {
  method_id: number;
  method_na: string;
}

/** Methods are the backend BO methods, registered automatically together with their transactions. */
const MetodosModule = ({ onBack }: { onBack: () => void }) => {
  const { data, loading, error } = useTx<Metodo[]>(TX.method.getAll);
  const [busqueda, setBusqueda] = useState("");

  const metodos = data ?? [];
  const filtered = metodos.filter((m) => m.method_na.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex items-center gap-3">
        <Waypoints className="w-6 h-6 text-accent" />
        <h2 className="text-xl font-bold text-foreground">Métodos del Sistema</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Métodos registrados</p>
            <p className="text-2xl font-bold text-foreground">{metodos.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar método..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-10" />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Método</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.method_id}>
                  <TableCell className="font-mono text-xs">{m.method_id}</TableCell>
                  <TableCell className="font-mono text-sm">{m.method_na}</TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">No se encontraron métodos</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetodosModule;
