import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, GraduationCap, Save, Shield, IdCard } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { TX } from "@/api/tx";
import { runTx, useTx } from "@/hooks/useTx";

interface UserDetail {
  user_id: number;
  user_na: string;
  user_em: string | null;
  user_act: boolean;
  person_ci: string | null;
  person_na: string | null;
  person_ln: string | null;
  person_ph: string | null;
  person_deg: string | null;
}

type ProfileForm = { user_em: string; person_ci: string; person_na: string; person_ln: string; person_ph: string; person_deg: string };

const nullable = (value: string) => value.trim() || null;

const PerfilModule = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const params = useMemo(() => ({ user_id: user?.user_id }), [user?.user_id]);
  const { data, error, reload } = useTx<UserDetail>(TX.user.get, params);
  // Profile 3 is super_admin in the backend seed.
  const isAdmin = user?.profile_ids.includes(3);
  const roleLabel = isAdmin ? "Administrador" : "Usuario";
  const roleColor = isAdmin ? "bg-amber-500 hover:bg-amber-600" : "bg-green-500 hover:bg-green-600";

  const [form, setForm] = useState<ProfileForm>({ user_em: "", person_ci: "", person_na: "", person_ln: "", person_ph: "", person_deg: "" });

  useEffect(() => {
    if (!data) return;
    setForm({
      user_em: data.user_em ?? "",
      person_ci: data.person_ci ?? "",
      person_na: data.person_na ?? "",
      person_ln: data.person_ln ?? "",
      person_ph: data.person_ph ?? "",
      person_deg: data.person_deg ?? "",
    });
  }, [data]);

  const handleSave = async () => {
    if (!data) return;
    const ok = await runTx(
      TX.user.update,
      {
        user_id: data.user_id,
        user_na: data.user_na,
        user_act: data.user_act,
        user_em: nullable(form.user_em),
        person_ci: nullable(form.person_ci),
        person_na: nullable(form.person_na),
        person_ln: nullable(form.person_ln),
        person_ph: nullable(form.person_ph),
        person_deg: nullable(form.person_deg),
      },
      "Perfil actualizado",
    );
    if (ok) reload();
  };

  const field = (key: keyof ProfileForm, label: string, type = "text") => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex items-center gap-3">
        <User className="w-6 h-6 text-accent" />
        <h2 className="text-xl font-bold text-foreground">Mi Perfil</h2>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{[form.person_na, form.person_ln].filter(Boolean).join(" ") || user?.user_na}</h3>
            <p className="text-sm text-muted-foreground mb-2">@{user?.user_na}</p>
            <Badge className={`${roleColor} text-white gap-1`}><Shield className="w-3 h-3" />{roleLabel}</Badge>
            <div className="mt-4 space-y-2 text-sm text-left w-full">
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{form.user_em || "—"}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><IdCard className="w-4 h-4" />{form.person_ci || "—"}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{form.person_ph || "—"}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><GraduationCap className="w-4 h-4" />{form.person_deg || "—"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Editar Información</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("person_na", "Nombre")}
              {field("person_ln", "Apellido")}
              {field("user_em", "Email", "email")}
              {field("person_ph", "Teléfono")}
              {field("person_ci", "Cédula")}
              {field("person_deg", "Carrera")}
            </div>
            <Button onClick={handleSave} disabled={!data}><Save className="w-4 h-4 mr-2" />Guardar Cambios</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerfilModule;
