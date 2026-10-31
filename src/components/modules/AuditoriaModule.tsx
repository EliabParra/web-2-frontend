import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Info } from "lucide-react";

// The backend records audit events (security.audit) but no transaction exposes them yet.
const AuditoriaModule = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <ClipboardList className="w-6 h-6 text-accent" />
      <h2 className="text-xl font-bold text-foreground">Auditoría del Sistema</h2>
    </div>

    <Card>
      <CardContent className="flex items-start gap-4 p-6">
        <Info className="w-6 h-6 text-muted-foreground shrink-0" />
        <div>
          <p className="font-medium text-foreground">Consulta de auditoría no disponible</p>
          <p className="text-sm text-muted-foreground mt-1">
            El sistema registra las acciones de los usuarios, pero todavía no existe una transacción para consultarlas desde aquí.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default AuditoriaModule;
