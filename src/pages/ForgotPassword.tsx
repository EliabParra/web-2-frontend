import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import URULogo from "@/components/URULogo";
import { ArrowLeft, CheckCircle, KeyRound, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tx } from "@/api/client";
import { TX } from "@/api/tx";

type RecoveryMode = "usuario" | "clave";
type Step = "email" | "notificacion" | "codigo" | "nueva-clave" | "exito";

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const mode: RecoveryMode = searchParams.get("mode") === "usuario" ? "usuario" : "clave";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  /** Runs a backend call, showing its error inline; resolves true on success. */
  const run = async (action: () => Promise<unknown>) => {
    setError("");
    setEnviando(true);
    try {
      await action();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error inesperado");
      return false;
    } finally {
      setEnviando(false);
    }
  };

  const handleEnviarCorreo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Ingrese un correo electrónico válido");
      return;
    }
    const txId = mode === "usuario" ? TX.auth.requestUsername : TX.auth.requestPasswordReset;
    if (await run(() => tx(txId, { email: email.trim() }))) setStep("notificacion");
  };

  const handleContinuarDesdeNotificacion = () => {
    if (mode === "usuario") {
      toast({
        title: "Revise su correo",
        description: "Se ha enviado su nombre de usuario a su correo electrónico.",
      });
      navigate("/login");
    } else {
      setStep("codigo");
    }
  };

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (codigo.trim().length !== 6) {
      setError("Ingrese el código de 6 dígitos");
      return;
    }
    if (await run(() => tx(TX.auth.verifyPasswordReset, { code: codigo.trim() }))) setStep("nueva-clave");
  };

  const handleCambiarClave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nuevaClave.trim()) {
      setError("Ingrese la nueva clave");
      return;
    }
    if (nuevaClave.length < 8) {
      setError("La clave debe tener al menos 8 caracteres");
      return;
    }
    if (nuevaClave !== confirmarClave) {
      setError("Las claves no coinciden");
      return;
    }
    if (await run(() => tx(TX.auth.resetPassword, { code: codigo.trim(), newPassword: nuevaClave }))) setStep("exito");
  };

  const titles: Record<Step, string> = {
    email: mode === "usuario" ? "Recuperar Usuario" : "Recuperar Clave",
    notificacion: "Correo Enviado",
    codigo: "Verificación",
    "nueva-clave": "Nueva Clave",
    exito: "¡Clave Actualizada!",
  };

  const descriptions: Record<Step, string> = {
    email: "Ingrese su correo electrónico registrado",
    notificacion: "Revise la bandeja de entrada de su correo",
    codigo: "Ingrese el código enviado a su correo",
    "nueva-clave": "Establezca su nueva clave de acceso",
    exito: "Su clave ha sido cambiada exitosamente",
  };

  const getIcon = () => {
    if (step === "exito") return <CheckCircle className="w-10 h-10 text-green-500" />;
    if (step === "notificacion") return <Mail className="w-10 h-10 text-accent" />;
    if (mode === "usuario") return <User className="w-10 h-10 text-accent" />;
    return <KeyRound className="w-10 h-10 text-accent" />;
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-5 bg-[url('/uru-blue-bg.png')] bg-cover bg-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-20 w-64 h-64 border border-foreground/20 rounded-full" />
        <div className="absolute bottom-20 left-20 w-96 h-96 border border-foreground/20 rounded-full" />
      </div>

      <div className="w-full max-w-md px-6 relative z-10">
        <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/20 p-4 rounded-full">
                {getIcon()}
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{titles[step]}</h1>
            <p className="text-muted-foreground text-sm">{descriptions[step]}</p>
          </div>

          {/* Step: Email */}
          {step === "email" && (
            <form onSubmit={handleEnviarCorreo} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              {error && <p className="text-destructive text-sm text-center">{error}</p>}
              <Button type="submit" disabled={enviando} className="w-full bg-primary hover:bg-accent text-primary-foreground font-semibold">
                Enviar
              </Button>
            </form>
          )}

          {/* Step: Notificación */}
          {step === "notificacion" && (
            <div className="space-y-5">
              <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg text-center space-y-2">
                <Mail className="w-8 h-8 text-accent mx-auto" />
                <p className="text-sm text-foreground">
                  {mode === "usuario"
                    ? "Se ha enviado su nombre de usuario al correo asociado."
                    : "Se ha enviado un código de verificación al correo ingresado."}
                </p>
                <p className="text-xs text-muted-foreground">{email}</p>
                <p className="text-xs text-muted-foreground">
                  Si el servidor no tiene correo configurado, el mensaje aparece en la consola del servidor:
                  pídaselo al administrador.
                </p>
              </div>
              <Button
                onClick={handleContinuarDesdeNotificacion}
                className="w-full bg-primary hover:bg-accent text-primary-foreground font-semibold"
              >
                {mode === "usuario" ? "Volver al Inicio de Sesión" : "Continuar"}
              </Button>
            </div>
          )}

          {/* Step: Código */}
          {step === "codigo" && (
            <form onSubmit={handleVerificarCodigo} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="codigo" className="text-foreground">Código de Verificación</Label>
                <Input
                  id="codigo"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Código de 6 dígitos"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  maxLength={6}
                />
              </div>
              {error && <p className="text-destructive text-sm text-center">{error}</p>}
              <Button type="submit" disabled={enviando} className="w-full bg-primary hover:bg-accent text-primary-foreground font-semibold">
                Verificar Código
              </Button>
            </form>
          )}

          {/* Step: Nueva Clave */}
          {step === "nueva-clave" && (
            <form onSubmit={handleCambiarClave} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nueva-clave" className="text-foreground">Nueva Clave</Label>
                <Input
                  id="nueva-clave"
                  type="password"
                  value={nuevaClave}
                  onChange={(e) => setNuevaClave(e.target.value)}
                  placeholder="Ingrese su nueva clave"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar-clave" className="text-foreground">Confirmar Clave</Label>
                <Input
                  id="confirmar-clave"
                  type="password"
                  value={confirmarClave}
                  onChange={(e) => setConfirmarClave(e.target.value)}
                  placeholder="Confirme su nueva clave"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              {error && <p className="text-destructive text-sm text-center">{error}</p>}
              <Button type="submit" disabled={enviando} className="w-full bg-primary hover:bg-accent text-primary-foreground font-semibold">
                Cambiar Clave
              </Button>
            </form>
          )}

          {/* Step: Éxito */}
          {step === "exito" && (
            <div className="space-y-8">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                <p className="text-sm text-foreground">
                  Su clave ha sido actualizada. Ya puede iniciar sesión con su nueva clave.
                </p>
              </div>
              <Link to="/login">
                <Button className="w-full bg-primary hover:bg-accent text-primary-foreground font-semibold">
                  Ir al Inicio de Sesión
                </Button>
              </Link>
            </div>
          )}

          {/* Back link */}
          {step !== "exito" && step !== "notificacion" && (
            <div className="mt-6 text-center">
              <Link to="/login" className="text-accent hover:text-accent/80 text-sm inline-flex items-center gap-1 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </div>

        <div className="flex justify-center mt-6">
          <URULogo size="sm" />
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;