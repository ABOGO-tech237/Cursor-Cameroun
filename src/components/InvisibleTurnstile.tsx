"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export type InvisibleTurnstileHandle = {
  /** Lance le défi et résout avec le jeton. Chaîne vide si Turnstile n'est pas configuré. */
  execute: () => Promise<string>;
};

type TurnstileApi = {
  ready: (callback: () => void) => void;
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function siteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
}

export function isTurnstileSiteKeyConfigured(): boolean {
  return siteKey().length > 0;
}

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("turnstile-script")), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("turnstile-script"));
    document.head.appendChild(script);
  });
}

/**
 * Widget Cloudflare Turnstile invisible.
 * Le mode Invisible se règle aussi dans le tableau Cloudflare (type de widget).
 * Ici le défi ne part qu'à l'envoi (`execution: "execute"`) et n'occupe pas la page.
 * Rien n'est rendu si `NEXT_PUBLIC_TURNSTILE_SITE_KEY` est absente.
 */
export function InvisibleTurnstile({ ref }: { ref?: Ref<InvisibleTurnstileHandle | null> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const readyRef = useRef(false);
  const pendingRef = useRef<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const key = siteKey();

  useImperativeHandle(ref, () => ({
    execute() {
      if (!key) return Promise.resolve("");

      return new Promise((resolve, reject) => {
        const widgetId = widgetIdRef.current;
        if (!readyRef.current || !widgetId || !window.turnstile) {
          reject(new Error("turnstile-not-ready"));
          return;
        }

        if (pendingRef.current) {
          clearTimeout(pendingRef.current.timer);
          pendingRef.current.reject(new Error("turnstile-superseded"));
        }

        const timer = setTimeout(() => {
          pendingRef.current = null;
          reject(new Error("turnstile-timeout"));
        }, 15_000);

        pendingRef.current = { resolve, reject, timer };
        window.turnstile.reset(widgetId);
        window.turnstile.execute(widgetId);
      });
    },
  }), [key]);

  useEffect(() => {
    if (!key || !containerRef.current) return;
    const container = containerRef.current;
    let cancelled = false;
    let widgetId: string | null = null;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        window.turnstile.ready(() => {
          if (cancelled || !window.turnstile) return;
          widgetId = window.turnstile.render(container, {
            sitekey: key,
            execution: "execute",
            appearance: "interaction-only",
            callback: (token: string) => {
              const pending = pendingRef.current;
              if (!pending) return;
              clearTimeout(pending.timer);
              pendingRef.current = null;
              pending.resolve(token);
            },
            "error-callback": () => {
              const pending = pendingRef.current;
              if (!pending) return;
              clearTimeout(pending.timer);
              pendingRef.current = null;
              pending.reject(new Error("turnstile-error"));
            },
            "expired-callback": () => {
              if (widgetIdRef.current && window.turnstile) {
                window.turnstile.reset(widgetIdRef.current);
              }
            },
          });
          widgetIdRef.current = widgetId;
          readyRef.current = true;
        });
      })
      .catch(() => {
        readyRef.current = false;
      });

    return () => {
      cancelled = true;
      readyRef.current = false;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      widgetIdRef.current = null;
    };
  }, [key]);

  if (!key) return null;

  return <div ref={containerRef} aria-hidden="true" className="h-0 w-0 overflow-hidden" />;
}
