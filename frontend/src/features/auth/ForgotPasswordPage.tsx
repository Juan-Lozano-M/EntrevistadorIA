import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { forgotPassword, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./AuthShell";

const schema = z.object({ email: z.string().email("Email inválido") });
type Form = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setServerError(null);
    try {
      await forgotPassword(data.email);
      setSent(true);
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Error inesperado");
    }
  };

  return (
    <AuthShell
      heading={<>¿Olvidaste tu<br />contraseña?</>}
      paragraph="Sin problema. Te enviamos un enlace para crear una nueva y volver a tu preparación en un momento."
      altPrompt="¿La recordaste?"
      altText="Inicia sesión"
      altTo="/login"
    >
      {sent ? (
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="h-7 w-7" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold">Revisa tu correo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña.
            Caduca en 1 hora.
          </p>
          <Button asChild size="lg" className="mt-6 w-full">
            <Link to="/login">Volver a iniciar sesión</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">Recuperar contraseña</h2>
            <p className="mt-1 text-sm text-muted-foreground">Introduce tu correo y te enviamos un enlace.</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="tucorreo@email.com" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            {serverError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              Enviar enlace
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Recordaste tu contraseña?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">Inicia sesión</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
