import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import URULogo from "@/components/URULogo";
import { FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tx } from "@/api/client";
import { TX } from "@/api/tx";

const messageOf = (error: unknown) => (error instanceof Error ? error.message : "Ocurrió un error inesperado");

const Register = () => {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [usuario, setUsuario] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [codigo, setCodigo] = useState("");
  const [registrado, setRegistrado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const run = async (action: () => Promise<unknown>, success: string) => {
    setEnviando(true);
    try {
      await action();
      toast({ title: success });
      return true;
    } catch (error) {
      toast({ title: "Error", description: messageOf(error), variant: "destructive" });
      return false;
    } finally {
      setEnviando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clave !== confirmarClave) {
      toast({
        title: "Error",
        description: "Las claves no coinciden",
        variant: "destructive",
      });
      return;
    }
    const ok = await run(
      () =>
        tx(TX.auth.register, {
          email: correo,
          password: clave,
          user_na: usuario,
          person_ci: cedula,
          person_na: nombre,
          person_ln: apellido,
        }),
      "Registro exitoso",
    );
    if (ok) setRegistrado(true);
  };

  const handleVerificar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run(() => tx(TX.auth.verifyEmail, { code: codigo.trim() }), "Correo verificado")) navigate("/login");
  };

  const reenviarCodigo = () =>
    run(() => tx(TX.auth.requestEmailVerification, { identifier: correo }), "Código reenviado");

  return (
    <div className="min-h-screen flex items-center justify-center pt-5 bg-[url('/uru-blue-bg.png')] bg-cover bg-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-20 w-64 h-64 border border-foreground/20 rounded-full" />
        <div className="absolute bottom-20 left-20 w-96 h-96 border border-foreground/20 rounded-full" />
      </div>

      <div className="w-full max-w-md px-6 relative z-10">
        <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-3">
            <div className="flex justify-center mb-3">
              <div className="bg-primary/20 p-3 rounded-full">
                <FlaskConical className="w-8 h-8 text-accent" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Registro</h1>
            <p className="text-muted-foreground text-sm">Crear nueva cuenta</p>
          </div>

          {registrado ? (
            <form onSubmit={handleVerificar} className="space-y-4">
              <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg text-sm text-foreground space-y-2">
                <p>Cuenta creada. Si el servidor exige verificar el correo, se envió un código de 6 dígitos a <strong>{correo}</strong>; de lo contrario ya puede iniciar sesión.</p>
                <p className="text-xs text-muted-foreground">
                  Si el servidor no tiene correo configurado, el código aparece en la consola del servidor:
                  pídaselo al administrador.
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Código de verificación</Label>
                <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} required maxLength={6}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-9 text-sm" placeholder="123456" />
              </div>
              <Button type="submit" disabled={enviando} className="w-full bg-primary hover:bg-accent text-primary-foreground font-semibold h-9 text-sm">
                Verificar correo
              </Button>
              <Button type="button" variant="outline" disabled={enviando} onClick={reenviarCodigo} className="w-full h-9 text-sm">
                Reenviar código
              </Button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-foreground">Nombre</Label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-9 text-sm" placeholder="Nombre" />
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Apellido</Label>
                <Input value={apellido} onChange={(e) => setApellido(e.target.value)} required
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-9 text-sm" placeholder="Apellido" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-foreground">Cédula</Label>
                <Input value={cedula} onChange={(e) => setCedula(e.target.value)} required
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-9 text-sm" placeholder="V-12345678" />
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">Usuario</Label>
                <Input value={usuario} onChange={(e) => setUsuario(e.target.value)} required
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-9 text-sm" placeholder="Usuario" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-foreground">Correo electrónico</Label>
              <Input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-9 text-sm" placeholder="correo@ejemplo.com" />
            </div>

            <div className="space-y-1">
              <Label className="text-foreground">Clave</Label>
              <Input type="password" value={clave} onChange={(e) => setClave(e.target.value)} required
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-9 text-sm" placeholder="Mínimo 8 caracteres" minLength={8} />
            </div>

            <div className="space-y-1">
              <Label className="text-foreground">Confirmar clave</Label>
              <Input type="password" value={confirmarClave} onChange={(e) => setConfirmarClave(e.target.value)} required
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-9 text-sm" placeholder="Repita su clave" />
              {clave && confirmarClave && clave !== confirmarClave && (
                <p className="text-destructive">Las claves no coinciden</p>
              )}
            </div>

            <Button type="submit" disabled={enviando} className="w-full bg-primary hover:bg-accent text-primary-foreground font-semibold h-9 text-sm">
              Registrarse
            </Button>
          </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-accent hover:text-accent/80 text-sm transition-colors">
              Ya tengo cuenta - Iniciar sesión
            </Link>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <URULogo size="sm" />
        </div>
      </div>
    </div>
  );
};

export default Register;