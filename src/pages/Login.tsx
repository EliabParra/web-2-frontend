import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import URULogo from "@/components/URULogo";
import { FlaskConical } from "lucide-react";

const Login = () => {
  const [user, setUser] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(user, clave);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credenciales inválidas. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/uru-blue-bg.png')] bg-cover bg-center relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 border border-foreground/20 rounded-full" />
        <div className="absolute bottom-20 right-20 w-96 h-96 border border-foreground/20 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 border border-foreground/20 rounded-full" />
      </div>

      <div className="w-full max-w-md px-6 relative z-10">
        <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/20 p-4 rounded-full">
                <FlaskConical className="w-8 h-8 text-accent" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Inicio de Sesión</h1>
            <p className="text-muted-foreground text-sm">Control de Préstamos del Laboratorio</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="user" className="text-foreground">Usuario o Correo Electrónico</Label>
              <Input
                id="user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="Ingrese su usuario o correo"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clave" className="text-foreground">Clave</Label>
              <Input
                id="clave"
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="Ingrese su clave"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-accent text-primary-foreground font-semibold">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Footer links */}
          <div className="mt-6 text-center space-y-2">
            <Link to="/register" className="text-accent hover:text-accent/80 text-sm block transition-colors">
              No tengo cuenta
            </Link>
            <Link to="/forgot-password?mode=clave" className="text-muted-foreground hover:text-foreground text-sm block transition-colors">
              Olvidé mi clave
            </Link>
            <Link to="/forgot-password?mode=usuario" className="text-muted-foreground hover:text-foreground text-sm block transition-colors">
              Olvidé mi usuario
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

export default Login;
