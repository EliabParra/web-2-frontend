import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Box, Search } from "lucide-react";
import BackButton from "@/components/BackButton";
import { TX } from "@/api/tx";
import { useTx } from "@/hooks/useTx";

interface ObjetoSistema {
  object_id: number;
  object_na: string;
}

/** Objects are the backend Business Objects, registered automatically from the BO folder. */
const ObjetosModule = ({ onBack }: { onBack: () => void }) => {
  const { data, loading, error } = useTx<ObjetoSistema[]>(TX.object.getAll);
  const [busqueda, setBusqueda] = useState("");

  const objetos = data ?? [];
  const filtered = objetos.filter((o) => o.object_na.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex items-center gap-3">
        <Box className="w-6 h-6 text-accent" />
        <h2 className="text-xl font-bold text-foreground">Objetos del Sistema</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Objetos registrados</p>
            <p className="text-2xl font-bold text-foreground">{objetos.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar objeto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-10" />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.object_id}>
                  <TableCell className="font-mono text-xs">{o.object_id}</TableCell>
                  <TableCell className="font-mono font-medium text-sm">{o.object_na}</TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">No se encontraron objetos</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ObjetosModule;
