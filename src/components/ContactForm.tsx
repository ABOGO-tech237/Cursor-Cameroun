"use client";

import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LOCALE_HEADER } from "@/lib/i18n/request-locale";
import { createContactSchema, type ContactFormValues } from "@/lib/schemas/contact";
import { HONEYPOT_FIELD, TURNSTILE_TOKEN_FIELD } from "@/lib/security/fields";
import {
  InvisibleTurnstile,
  isTurnstileSiteKeyConfigured,
  type InvisibleTurnstileHandle,
} from "@/components/InvisibleTurnstile";

const ERROR_CODES = new Set([
  "invalid",
  "rateLimited",
  "turnstile",
  "unavailable",
  "sendFailed",
]);

function fieldClass(invalid: boolean) {
  return [
    "rounded-md border bg-bg px-4 py-2 text-sm text-text focus:outline-none focus-visible:ring-2",
    invalid ? "border-text ring-text/20" : "border-border focus-visible:ring-ring/20",
  ].join(" ");
}

export function ContactForm() {
  const t = useTranslations();
  const tErrors = useTranslations("contact.errors");
  const locale = useLocale();
  const honeypotRef = useRef<HTMLInputElement>(null);
  const turnstileRef = useRef<InvisibleTurnstileHandle>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const schema = useMemo(
    () => createContactSchema((key) => tErrors(key)),
    [tErrors],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      consent: false,
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let turnstileToken = "";
      if (isTurnstileSiteKeyConfigured()) {
        try {
          turnstileToken = (await turnstileRef.current?.execute()) ?? "";
        } catch {
          setError(tErrors("turnstile"));
          return;
        }
        if (!turnstileToken) {
          setError(tErrors("turnstile"));
          return;
        }
      }

      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [LOCALE_HEADER]: locale,
        },
        body: JSON.stringify({
          ...data,
          [HONEYPOT_FIELD]: honeypotRef.current?.value ?? "",
          [TURNSTILE_TOKEN_FIELD]: turnstileToken,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          code?: string;
          error?: string;
          fieldErrors?: Record<string, string>;
        } | null;
        const fieldMessage = payload?.fieldErrors
          ? Object.values(payload.fieldErrors).find((value) => typeof value === "string")
          : undefined;
        if (fieldMessage) {
          setError(fieldMessage);
        } else if (payload?.code && ERROR_CODES.has(payload.code)) {
          setError(tErrors(payload.code as "invalid"));
        } else {
          setError(t("contact.errorBody"));
        }
        return;
      }

      setIsSuccess(true);
      reset();
      if (honeypotRef.current) honeypotRef.current.value = "";
    } catch {
      setError(t("contact.errorBody"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 p-12 text-center"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface-2 text-text">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-2xl font-semibold text-text">
          {t("contact.successTitle")}
        </h3>
        <p className="mt-2 text-text-2">{t("contact.successBody")}</p>
        <button
          type="button"
          onClick={() => setIsSuccess(false)}
          className="mt-8 rounded-md bg-text px-6 py-2 text-sm font-medium text-bg hover:opacity-90"
        >
          {t("contact.sendAnother")}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-1 md:p-2">
      <form
        noValidate
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
        className="relative flex flex-col gap-5 p-6 md:p-8"
      >
        <div className="pointer-events-none absolute h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor={HONEYPOT_FIELD}>HP</label>
          <input
            ref={honeypotRef}
            id={HONEYPOT_FIELD}
            name={HONEYPOT_FIELD}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium text-text-2">
              {t("contact.formName")}
            </label>
            <input
              {...register("name")}
              id="name"
              autoComplete="name"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={fieldClass(Boolean(errors.name))}
            />
            {errors.name && (
              <span id="name-error" className="text-xs text-text-2">{errors.name.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-text-2">
              {t("contact.formEmail")}
            </label>
            <input
              {...register("email")}
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={fieldClass(Boolean(errors.email))}
            />
            {errors.email && (
              <span id="email-error" className="text-xs text-text-2">{errors.email.message}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="subject" className="text-sm font-medium text-text-2">
            {t("contact.formSubject")}
          </label>
          <input
            {...register("subject")}
            id="subject"
            autoComplete="off"
            aria-invalid={errors.subject ? true : undefined}
            aria-describedby={errors.subject ? "subject-error" : undefined}
            className={fieldClass(Boolean(errors.subject))}
          />
          {errors.subject && (
            <span id="subject-error" className="text-xs text-text-2">{errors.subject.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-sm font-medium text-text-2">
            {t("contact.formMessage")}
          </label>
          <textarea
            {...register("message")}
            id="message"
            rows={5}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? "message-error" : undefined}
            className={`resize-none ${fieldClass(Boolean(errors.message))}`}
          />
          {errors.message && (
            <span id="message-error" className="text-xs text-text-2">{errors.message.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <input
              {...register("consent")}
              id="consent"
              type="checkbox"
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? "consent-error" : undefined}
              className="mt-1 h-4 w-4 shrink-0 accent-text"
            />
            <div className="text-sm leading-6 text-text-2">
              <label htmlFor="consent" className="cursor-pointer">
                {t("contact.consentLead")}
              </label>{" "}
              <Link
                href="/privacy"
                className="font-medium text-text underline decoration-border hover:decoration-text"
              >
                {t("contact.privacyLink")}
              </Link>
            </div>
          </div>
          {errors.consent && (
            <span id="consent-error" className="text-xs text-text-2">{errors.consent.message}</span>
          )}
        </div>

        <InvisibleTurnstile ref={turnstileRef} />

        <AnimatePresence>
          {error && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
              className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text"
              role="alert"
            >
              <AlertCircle size={16} aria-hidden="true" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative mt-2 flex items-center justify-center gap-2 overflow-hidden rounded-md bg-text px-6 py-3 text-sm font-medium text-bg transition-all hover:opacity-90 disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t("contact.formSending")}
            </>
          ) : (
            <>
              <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
              {t("contact.formSubmit")}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
