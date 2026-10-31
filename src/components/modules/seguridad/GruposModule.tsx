import { Card, CardContent } from "@/components/ui/card";
import { Users, Info } from "lucide-react";
import BackButton from "@/components/BackButton";

/** The backend has a business.group table but no Group BO, so there is nothing to call yet. */
const GruposModule = ({ onBack }: { onBack: () => void }) => (
  <div className="space-y-6">
    <BackButton onClick={onBack} />
    <div className="flex items-center gap-3">
      <Users className="w-6 h-6 text-accent" />
      <h2 className="text-xl font-bold text-foreground">Gestión de Grupos</h2>
    </div>
    <Card>
      <CardContent className="p-6 flex items-start gap-3 text-sm text-muted-foreground">
        <Info className="w-5 h-5 text-accent shrink-0" />
        <p>La gestión de grupos todavía no está disponible en el servidor. Este módulo se habilitará cuando exista.</p>
      </CardContent>
    </Card>
  </div>
);

export default GruposModule;
