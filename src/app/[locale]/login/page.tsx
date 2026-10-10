"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { FadeIn } from "@/components/FadeIn";
import { Lock, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin/events");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Mot de passe incorrect");
      }
    } catch (err) {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <FadeIn className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-surface-1 p-8 shadow-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-text text-bg">
              <Lock size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Administration</h1>
            <p className="mt-2 text-sm text-text-2">
              Veuillez entrer le mot de passe pour accéder à l’espace admin.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-text-2 uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-4 py-3 pr-12 text-text focus:border-text focus:outline-none focus:ring-1 focus:ring-text transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-2 hover:text-text transition-colors"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 p-3 text-sm text-text">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-text px-4 py-3 font-semibold text-bg transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Connexion..." : "Se connecter"}
              {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
            </button>
          </form>
        </div>
      </FadeIn>
    </div>
  );
}
