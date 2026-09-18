import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { defaultRouteForRole } from "@/lib/rbac";
import { LoginForm } from "@/components/auth/login-form";
import { Wine } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect(defaultRouteForRole(session.user.role));
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-[#111111] p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#D4AF37]">
            <Wine className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">LiquorFlow</span>
        </div>
        <div className="space-y-3">
          <p className="text-3xl font-semibold leading-tight">
            Gestión integral para tu <span className="text-[#D4AF37]">licorería</span>.
          </p>
          <p className="max-w-md text-sm text-white/60">
            Ventas, inventario, caja y compras en un solo sistema. Diseñado para
            licorerías en Arequipa y todo el Perú.
          </p>
        </div>
        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} LiquorFlow. Todos los derechos reservados.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-6 p-6 sm:p-10">
        <div className="flex w-full max-w-sm items-center gap-2 lg:hidden">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#D4AF37]">
            <Wine className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">LiquorFlow</span>
        </div>
        <div className="w-full max-w-sm">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
