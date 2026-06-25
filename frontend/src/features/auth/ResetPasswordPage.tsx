import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { resetPassword, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./AuthShell";
import { PasswordRevealButton } from "@/components/PasswordRevealButton";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    if (!token) return;
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      toast.success("Contraseña actualizada. Ya puedes iniciar sesión.");
      navigate("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      heading={<>Crea una<br />nueva contraseña</>}
      paragraph="Elige una contraseña segura para tu cuenta y vuelve a tu preparación."
      altPrompt="¿Ya la tienes?"
      altText="Inicia sesión"
      altTo="/login"
    >
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">Nueva contraseña</h2>
        <p className="mt-1 text-sm text-muted-foreground">Crea una contraseña para recuperar el acceso.</p>
      </div>

      {!token ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">Enlace no válido</p>
          <p className="mt-1 text-destructive/90">
            Falta el código de recuperación.{" "}
            <Link to="/forgot-password" className="font-semibold underline">Solicita uno nuevo</Link>.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="password">Nueva contraseña</Label>
            <div className="relative">
              <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••"
                autoComplete="new-password" className="pr-10" value={password}
                onChange={(e) => setPassword(e.target.value)} />
              <PasswordRevealButton onChange={setShowPw} />
            </div>
            <p className="text-xs text-muted-foreground">Usa al menos 8 caracteres.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <Input id="confirm" type={showPw ? "text" : "password"} placeholder="••••••••"
              autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            Guardar contraseña
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
