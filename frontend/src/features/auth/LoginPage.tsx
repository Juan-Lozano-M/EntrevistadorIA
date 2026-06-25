import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { login, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./AuthShell";
import { SocialButtons, OrDivider } from "./AuthExtras";
import { PasswordRevealButton } from "@/components/PasswordRevealButton";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Requerido"),
});
type Form = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setServerError(null);
    try {
      const res = await login(data);
      setAuth(res, remember);
      toast.success(`Bienvenido, ${res.name}`);
      navigate("/app");
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Error inesperado");
    }
  };

  return (
    <AuthShell
      heading={<>Bienvenido de vuelta<br />a tu preparación</>}
      paragraph="Continúa donde lo dejaste: retoma tus simulaciones, revisa tu progreso y sigue mejorando con feedback de IA."
      altPrompt="¿No tienes cuenta?"
      altText="Regístrate"
      altTo="/register"
    >
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">Inicia sesión</h2>
        <p className="mt-1 text-sm text-muted-foreground">Accede a tu panel de progreso y entrevistas.</p>
      </div>

      <SocialButtons />
      <OrDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" placeholder="tucorreo@email.com" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••"
              autoComplete="current-password" className="pr-10" {...register("password")} />
            <PasswordRevealButton onChange={setShowPw} />
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        {serverError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>Iniciar sesión</Button>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-border" style={{ accentColor: "hsl(var(--primary))" }} />
          Mantener sesión iniciada
        </label>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="font-semibold text-primary hover:underline">Regístrate</Link>
      </p>
    </AuthShell>
  );
}
