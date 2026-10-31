import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Building2, Save, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";

const PerfilModule = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  // Profile 3 is super_admin in the backend seed.
  const isAdmin = user?.profile_ids.includes(3);
  const roleLabel = isAdmin ? "Administrador" : "Usuario";
  const roleColor = isAdmin ? "bg-amber-500 hover:bg-amber-600" : "bg-green-500 hover:bg-green-600";

  const [form, setForm] = useState({
    nombre: user?.user_na || "",
    apellido: "",
    email: user?.user_em || "",
    telefono: "0414-0000000",
    departamento: "Sistemas",
    cargo: roleLabel + " del Sistema",
  });

  const handleSave = () => {
    toast({ title: "Perfil actualizado", description: "Los datos del perfil se guardaron correctamente." });
  };

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />
      <div className="flex items-center gap-3">
        <User className="w-6 h-6 text-accent" />
        <h2 className="text-xl font-bold text-foreground">Mi Perfil</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{form.nombre} {form.apellido}</h3>
            <p className="text-sm text-muted-foreground mb-2">{form.cargo}</p>
            <Badge className={`${roleColor} text-white gap-1`}><Shield className="w-3 h-3" />{roleLabel}</Badge>
            <div className="mt-4 space-y-2 text-sm text-left w-full">
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{form.email}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{form.telefono}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Building2 className="w-4 h-4" />{form.departamento}</div>
            </div>
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Editar Información</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
              <div className="space-y-2"><Label>Apellido</Label><Input value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Teléfono</Label><Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
              <div className="space-y-2"><Label>Departamento</Label><Input value={form.departamento} onChange={(e) => setForm({ ...form, departamento: e.target.value })} /></div>
              <div className="space-y-2"><Label>Cargo</Label><Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} /></div>
            </div>
            <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" />Guardar Cambios</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerfilModule;
