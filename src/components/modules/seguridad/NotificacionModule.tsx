import { Card, CardContent } from "@/components/ui/card";
import { Bell, Info } from "lucide-react";
import BackButton from "@/components/BackButton";

/** The backend has no notification templates or SMTP settings; email is configured with server env vars. */
const NotificacionModule = ({ onBack }: { onBack: () => void }) => (
  <div className="space-y-6">
    <BackButton onClick={onBack} />
    <div className="flex items-center gap-3">
      <Bell className="w-6 h-6 text-accent" />
      <h2 className="text-xl font-bold text-foreground">Configuración de Notificaciones</h2>
    </div>
    <Card>
      <CardContent className="p-6 flex items-start gap-3 text-sm text-muted-foreground">
        <Info className="w-5 h-5 text-accent shrink-0" />
        <p>
          El servidor no maneja plantillas de notificación ni configuración de correo desde la aplicación.
          El envío de correos se configura en las variables de entorno del servidor (archivo <code>.env</code>).
        </p>
      </CardContent>
    </Card>
  </div>
);

export default NotificacionModule;
