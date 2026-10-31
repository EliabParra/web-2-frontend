import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Key, ShieldCheck, ShieldOff } from "lucide-react";
import BackButton from "@/components/BackButton";
import { TX } from "@/api/tx";
import { runTx, useTx } from "@/hooks/useTx";

interface Perfil { profile_id: number; profile_na: string }
interface Objeto { object_id: number; object_na: string }
interface Metodo { method_id: number; method_na: string }

/**
 * Grants or revokes one (object, method) permission for a profile.
 * The backend has no transaction to list a profile's current permissions, so no matrix is shown.
 */
const PermisosModModule = ({ onBack }: { onBack: () => void }) => {
  const perfiles = useTx<Perfil[]>(TX.profile.getAll);
  const objetos = useTx<Objeto[]>(TX.object.getAll);
  const metodos = useTx<Metodo[]>(TX.method.getAll);
  const [profileId, setProfileId] = useState("");
  const [objectNa, setObjectNa] = useState("");
  const [methodNa, setMethodNa] = useState("");

  const error = perfiles.error ?? objetos.error ?? metodos.error;
  const ready = profileId && objectNa && methodNa;
  const params = { profile_id: Number(profileId), object_na: objectNa, method_na: methodNa };

  const grant = () => runTx(TX.profile.grantPermission, params, `Permiso ${objectNa}.${methodNa} concedido`);
  const revoke = () => runTx(TX.profile.revokePermission, params, `Permiso ${objectNa}.${methodNa} revocado`);

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex items-center gap-3">
        <Key className="w-6 h-6 text-accent" />
        <h2 className="text-xl font-bold text-foreground">Permisos por Perfil</h2>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger><SelectValue placeholder="Seleccione un perfil" /></SelectTrigger>
                <SelectContent>
                  {(perfiles.data ?? []).map((p) => (
                    <SelectItem key={p.profile_id} value={String(p.profile_id)}>{p.profile_na}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Objeto</Label>
              <Select value={objectNa} onValueChange={setObjectNa}>
                <SelectTrigger><SelectValue placeholder="Seleccione un objeto" /></SelectTrigger>
                <SelectContent>
                  {(objetos.data ?? []).map((o) => (
                    <SelectItem key={o.object_id} value={o.object_na}>{o.object_na}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Select value={methodNa} onValueChange={setMethodNa}>
                <SelectTrigger><SelectValue placeholder="Seleccione un método" /></SelectTrigger>
                <SelectContent>
                  {(metodos.data ?? []).map((m) => (
                    <SelectItem key={m.method_id} value={m.method_na}>{m.method_na}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={grant} disabled={!ready}><ShieldCheck className="w-4 h-4 mr-2" />Conceder</Button>
            <Button variant="outline" onClick={revoke} disabled={!ready}><ShieldOff className="w-4 h-4 mr-2" />Revocar</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            El servidor aún no permite consultar los permisos actuales de un perfil; aquí solo se conceden o revocan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermisosModModule;
