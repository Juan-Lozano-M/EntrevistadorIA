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

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Requerido"),
});
type Form = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setServerError(null);
    try {
      const res = await login(data);
      setAuth(res);
      toast.success(`Bienvenido, ${res.name}`);
      navigate("/");
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Error inesperado");
    }
  };

  return (
    <AuthShell>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold">Inicia sesión</h2>
        <p className="mt-1 text-sm text-muted-foreground">Continúa tu preparación.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="tu@email.com" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        {serverError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          Iniciar sesión
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">Regístrate</Link>
      </p>
    </AuthShell>
  );
}
