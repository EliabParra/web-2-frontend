import { Bell, CheckCheck, Clock, Info, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { TX } from "@/api/tx";
import { tx } from "@/api/client";
import { useTx } from "@/hooks/useTx";

export interface Notificacion {
  notification_id: number;
  notification_ty: string | null;
  notification_tit: string | null;
  notification_msg: string | null;
  notification_read: boolean;
  notification_dt: string;
  user_id: number;
}

const ALERT_TYPES = ["vencimiento", "urgente", "alerta"];

const tipoIcon = (n: Notificacion) => {
  const ty = (n.notification_ty ?? "").toLowerCase();
  if (ALERT_TYPES.includes(ty)) return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  if (n.notification_read) return <CheckCheck className="w-4 h-4 text-emerald-400" />;
  return <Info className="w-4 h-4 text-blue-400" />;
};

const formatFecha = (dt: string) => new Date(dt).toLocaleString("es");

const markRead = (id: number) => tx(TX.notification.update, { id, notification_read: true });

const NotificationsPanel = () => {
  const { data, reload } = useTx<Notificacion[]>(TX.notification.getAll);
  const notificaciones = data ?? [];
  const noLeidas = notificaciones.filter((n) => !n.notification_read);

  const marcarTodasLeidas = async () => {
    await Promise.allSettled(noLeidas.map((n) => markRead(n.notification_id)));
    reload();
  };

  const marcarLeida = async (n: Notificacion) => {
    if (n.notification_read) return;
    await markRead(n.notification_id).catch(() => undefined);
    reload();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white dark:text-foreground hover:bg-white/10 dark:hover:bg-secondary relative">
          <Bell className="w-5 h-5" />
          {noLeidas.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {noLeidas.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-card border-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Notificaciones</h3>
          {noLeidas.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-accent h-auto py-1" onClick={marcarTodasLeidas}>
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[350px]">
          {notificaciones.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Sin notificaciones</p>
          ) : (
            notificaciones.map((n) => (
              <button
                key={n.notification_id}
                onClick={() => marcarLeida(n)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 transition-colors hover:bg-secondary/50 ${
                  !n.notification_read ? "bg-secondary/30" : ""
                }`}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0">{tipoIcon(n)}</div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${!n.notification_read ? "text-foreground" : "text-muted-foreground"}`}>
                      {n.notification_tit}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.notification_msg}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatFecha(n.notification_dt)}
                    </p>
                  </div>
                  {!n.notification_read && <span className="w-2 h-2 bg-accent rounded-full mt-1.5 shrink-0" />}
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPanel;
