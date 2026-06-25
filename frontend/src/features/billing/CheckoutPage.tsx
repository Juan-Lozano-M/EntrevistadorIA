import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Wallet, Landmark, Lock, Loader2, Star, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getBillingConfig, subscribe, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SDK_SRC = "https://sdk.mercadopago.com/js/v2";

function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as { MercadoPago?: unknown }).MercadoPago) return resolve();
    const existing = document.querySelector(`script[src="${SDK_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar MercadoPago")));
      return;
    }
    const s = document.createElement("script");
    s.src = SDK_SRC;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar MercadoPago"));
    document.body.appendChild(s);
  });
}

function errorText(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (Array.isArray(e)) {
    const msg = e.map((x) => (x as { message?: string }).message).filter(Boolean).join(", ");
    return msg || "Revisa los datos de la tarjeta";
  }
  if (e instanceof Error) return e.message;
  return "No se pudo completar el pago";
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user, setPlan } = useAuthStore();
  const isPremium = user?.plan === "PREMIUM";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState("");
  const [idTypes, setIdTypes] = useState<{ id: string; name: string }[]>([]);
  const [idType, setIdType] = useState("CC");
  const [idNumber, setIdNumber] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mpRef = useRef<any>(null);

  const cfg = useQuery({ queryKey: ["billing-config"], queryFn: getBillingConfig });
  const amount = cfg.data?.amount ?? 0;
  const currency = cfg.data?.currency ?? "";
  const price = `${amount.toLocaleString()} ${currency}`;

  useEffect(() => {
    if (isPremium) navigate("/app/configuracion", { replace: true });
  }, [isPremium, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await getBillingConfig();
        if (cancelled) return;
        if (!c.publicKey) throw new Error("Los pagos no están configurados (falta MP_PUBLIC_KEY).");
        await loadSdk();
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const MP = (window as any).MercadoPago;
        const mp = new MP(c.publicKey, { locale: "es-CO" });
        mpRef.current = mp;
        const dark = document.documentElement.classList.contains("dark");
        const style = {
          fontSize: "15px",
          color: dark ? "#e5e7eb" : "#111827",
          placeholderColor: dark ? "#6b7280" : "#9ca3af",
        };
        mp.fields.create("cardNumber", { placeholder: "1234 1234 1234 1234", style }).mount("co-cardNumber");
        mp.fields.create("expirationDate", { placeholder: "MM/AA", style }).mount("co-expiration");
        mp.fields.create("securityCode", { placeholder: "CVC", style }).mount("co-securityCode");
        try {
          const types = await mp.getIdentificationTypes();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!cancelled && Array.isArray(types) && types.length) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setIdTypes(types.map((t: any) => ({ id: t.id, name: t.name })));
            setIdType(types[0].id);
          }
        } catch { /* keep CC default */ }
        if (!cancelled) setLoading(false);
      } catch (e) {
        if (!cancelled) { setError(errorText(e)); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpRef.current || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const mp = mpRef.current;
      const token = await mp.fields.createCardToken({
        cardholderName, identificationType: idType, identificationNumber: idNumber,
      });
      if (!token?.id) throw new Error("No se pudo procesar la tarjeta");
      const last4 = token.last_four_digits ?? "";
      let brand = "", paymentMethodId = "";
      try {
        const pm = await mp.getPaymentMethods({ bin: token.first_six_digits });
        brand = pm?.results?.[0]?.name ?? "";
        paymentMethodId = pm?.results?.[0]?.id ?? "";
      } catch { /* optional */ }

      const res = await subscribe({
        tokenPay: "", tokenSub: token.id, paymentMethodId,
        idType, idNumber, cardLast4: last4, cardBrand: brand,
      });

      if (res.status === "authorized") {
        setPlan("PREMIUM");
        toast.success("¡Pago aprobado! Ya eres Premium.");
        navigate("/app");
      } else {
        toast("Tu pago está en revisión. Te activaremos en cuanto se apruebe.");
        navigate("/app/configuracion");
      }
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  };

  const fieldBox = "mp-field h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

  return (
    <div className="app-backdrop min-h-screen">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" aria-label="Inicio"><Brand /></Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <Link to="/precios" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a planes
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Finaliza tu compra</h1>
        <p className="mt-1 text-sm text-muted-foreground">Estás a un paso de practicar sin límites.</p>

        <form onSubmit={pay} className="mt-5 grid gap-5 lg:grid-cols-[1fr_22rem]">
          {/* Left: contact + payment */}
          <div className="space-y-4">
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display font-semibold">1 · Información de contacto</h2>
              <div className="mt-3 space-y-1.5">
                <Label>Correo electrónico</Label>
                <Input value={user?.email ?? ""} readOnly disabled />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display font-semibold">2 · Método de pago</h2>
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                <div className="flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary">
                  <CreditCard className="h-4 w-4" /> Tarjeta
                </div>
                {[{ icon: Wallet, label: "PayPal" }, { icon: Landmark, label: "Transferencia" }].map(({ icon: Icon, label }) => (
                  <div key={label} title="Próximamente"
                    className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground opacity-60">
                    <Icon className="h-4 w-4" /> {label}
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label>Número de tarjeta</Label>
                  <div id="co-cardNumber" className={fieldBox} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Vencimiento</Label>
                    <div id="co-expiration" className={fieldBox} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CVC</Label>
                    <div id="co-securityCode" className={fieldBox} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="holder">Nombre en la tarjeta</Label>
                  <Input id="holder" placeholder="Como aparece en la tarjeta" value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-[7rem_1fr] gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="idType">Documento</Label>
                    <select id="idType" value={idType} onChange={(e) => setIdType(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm">
                      {idTypes.length > 0
                        ? idTypes.map((t) => <option key={t.id} value={t.id}>{t.id}</option>)
                        : <option value="CC">CC</option>}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="idNumber">Número de documento</Label>
                    <Input id="idNumber" inputMode="numeric" value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)} required />
                  </div>
                </div>
                {loading && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Cargando pago seguro…
                  </p>
                )}
                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right: order summary */}
          <aside className="lg:sticky lg:top-5 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display font-semibold">Resumen del pedido</h2>
              <div className="mt-4 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Star className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">Plan Pro</p>
                  <p className="text-sm text-muted-foreground">Acceso Premium</p>
                </div>
              </div>

              <div className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono tabular">{price}</span>
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between border-t border-border pt-5">
                <div>
                  <p className="font-semibold">Total</p>
                  <p className="text-xs text-muted-foreground">Pago único · acceso Premium</p>
                </div>
                <span className="font-mono text-2xl font-bold tabular">{price}</span>
              </div>

              <Button type="submit" size="lg" className="mt-5 w-full" disabled={loading || submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Procesando…</> : `Pagar ${price}`}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Pago cifrado y seguro
              </p>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}
