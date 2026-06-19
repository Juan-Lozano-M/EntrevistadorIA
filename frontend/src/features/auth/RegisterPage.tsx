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
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setServerError(null);
    try {
      const res = await registerApi(data);
      setAuth(res);
      toast.success(`Cuenta creada. ¡Hola, ${res.name}!`);
      navigate("/");
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Error inesperado");
    }
  };

  return (
    <AuthShell>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold">Crea tu cuenta</h2>
        <p className="mt-1 text-sm text-muted-foreground">Empieza a practicar en minutos.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" placeholder="Tu nombre" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="tu@email.com" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" placeholder="Mínimo 8 caracteres" {...register("password")} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        {serverError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          Crear cuenta
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">Inicia sesión</Link>
      </p>
    </AuthShell>
  );
}
