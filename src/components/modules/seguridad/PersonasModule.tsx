import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserCircle, Search, Mail, Phone } from "lucide-react";
import BackButton from "@/components/BackButton";
import { TX } from "@/api/tx";
import { useTx } from "@/hooks/useTx";

/** The backend has no Person BO; persons are read from the users that own them. */
interface Persona {
  user_id: number;
  user_em: string | null;
  person_ci: string | null;
  person_na: string | null;
  person_ln: string | null;
  person_ph: string | null;
  person_deg: string | null;
}

const PersonasModule = ({ onBack }: { onBack: () => void }) => {
  const { data, loading, error } = useTx<Persona[]>(TX.user.getAll);
  const [busqueda, setBusqueda] = useState("");

  const personas = data ?? [];
  const term = busqueda.toLowerCase();
  const filtered = personas.filter((p) =>
    `${p.person_na ?? ""} ${p.person_ln ?? ""}`.toLowerCase().includes(term) || (p.person_ci ?? "").includes(busqueda)
  );

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex items-center gap-3">
        <UserCircle className="w-6 h-6 text-accent" />
        <h2 className="text-xl font-bold text-foreground">Registro de Personas</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Personas registradas</p>
            <p className="text-2xl font-bold text-foreground">{personas.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre o cédula..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-10" />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cédula</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Carrera</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.user_id}>
                  <TableCell className="font-mono text-xs">{p.person_ci ?? "—"}</TableCell>
                  <TableCell className="font-medium">{[p.person_na, p.person_ln].filter(Boolean).join(" ") || "—"}</TableCell>
                  <TableCell className="text-muted-foreground"><span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.user_em ?? "—"}</span></TableCell>
                  <TableCell className="text-muted-foreground"><span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.person_ph ?? "—"}</span></TableCell>
                  <TableCell>{p.person_deg ?? "—"}</TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No se encontraron personas</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonasModule;
