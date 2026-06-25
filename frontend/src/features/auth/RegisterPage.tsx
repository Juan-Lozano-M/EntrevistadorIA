import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { register as registerApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./AuthShell";
import { SocialButtons, OrDivider, comingSoon } from "./AuthExtras";
import { PasswordRevealButton } from "@/components/PasswordRevealButton";

const schema = z.object({
  name: z.string().min(1, "Requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});
type Form = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setServerError(null);
    try {
      const res = await registerApi(data);
      setAuth(res);
      toast.success(`Cuenta creada. ¡Hola, ${res.name}!`);
      navigate("/app");
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Error inesperado");
    }
  };

  return (
    <AuthShell
      heading={<>Empieza a preparar<br />tu próxima entrevista</>}
      paragraph="Crea tu cuenta gratis y practica entrevistas realistas para cualquier profesión, con evaluación y un plan de mejora personalizado."
      altPrompt="¿Ya tienes cuenta?"
      altText="Inicia sesión"
      altTo="/login"
    >
      <div className="mb-4">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">Crea tu cuenta</h2>
        <p className="mt-1 text-sm text-muted-foreground">Gratis para empezar. Sin tarjeta de crédito.</p>
      </div>

      <SocialButtons />
      <OrDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre completo</Label>
          <Input id="name" placeholder="Tu nombre" autoComplete="name" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" placeholder="tucorreo@email.com" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••"
              autoComplete="new-password" className="pr-10" {...register("password")} />
            <PasswordRevealButton onChange={setShowPw} />
          </div>
          {errors.password
            ? <p className="text-sm text-destructive">{errors.password.message}</p>
            : <p className="text-xs text-muted-foreground">Usa al menos 8 caracteres.</p>}
        </div>

        <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border" style={{ accentColor: "hsl(var(--primary))" }} />
          <span>
            Acepto los{" "}
            <button type="button" onClick={() => comingSoon("Los Términos de servicio")} className="font-medium text-primary hover:underline">Términos de servicio</button>
            {" "}y la{" "}
            <button type="button" onClick={() => comingSoon("La Política de privacidad")} className="font-medium text-primary hover:underline">Política de privacidad</button>.
          </span>
        </label>

        {serverError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !accepted}>
          Crear cuenta gratis
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">Inicia sesión</Link>
      </p>
    </AuthShell>
  );
}
