"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LINKS } from "@/data/links";
import { LOCALE_HEADER } from "@/lib/i18n/request-locale";
import {
  PARTNER_CITIES,
  PARTNER_CONTACT_PREFERENCES,
  PARTNER_OFFERS,
  PARTNER_POWER,
  PARTNER_SECTORS,
  createPartnerSchema,
  type PartnerFormValues,
} from "@/lib/schemas/partner";
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
    "w-full rounded-md border bg-bg px-4 py-2 text-sm text-text focus:outline-none focus-visible:ring-2",
    invalid ? "border-text ring-text/20" : "border-border focus-visible:ring-ring/20",
  ].join(" ");
}

export function PartnerForm() {
  const t = useTranslations("partners");
  const tErrors = useTranslations("partners.errors");
  const locale = useLocale();
  const honeypotRef = useRef<HTMLInputElement>(null);
  const turnstileRef = useRef<InvisibleTurnstileHandle>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(
    () => createPartnerSchema((key) => tErrors(key)),
    [tErrors],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError: setFieldError,
    formState: { errors },
  } = useForm<PartnerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organization: "",
      contactName: "",
      whatsapp: "+237",
      contactPreference: "",
      email: "",
      city: "",
      country: "",
      link: "",
      sector: "",
      offers: [],
      capacity: "",
      wifi: "",
      power: "",
      av: "",
      availability: "",
      details: "",
      consent: false,
    },
  });

  const city = useWatch({ control, name: "city" });
  const selectedOffers = useWatch({ control, name: "offers" });
  const venue = selectedOffers?.includes("venue") ?? false;
  const diaspora = city === "diaspora";

  useEffect(() => {
    if (isSuccess) successRef.current?.focus();
  }, [isSuccess]);

  const onSubmit = async (data: PartnerFormValues) => {
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

      const response = await fetch("/api/partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [LOCALE_HEADER]: locale,
        },
        body: JSON.stringify({
          ...data,
          country: data.city === "diaspora" ? data.country : "",
          offers: data.offers ?? [],
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
        if (payload?.fieldErrors) {
          for (const [key, message] of Object.entries(payload.fieldErrors)) {
            setFieldError(key as keyof PartnerFormValues, { message });
          }
          const fieldMessage = Object.values(payload.fieldErrors)[0];
          if (fieldMessage) {
            setError(fieldMessage);
            return;
          }
        }
        if (payload?.code && ERROR_CODES.has(payload.code)) {
          setError(tErrors(payload.code as "invalid"));
        } else {
          setError(t("errorBody"));
        }
        return;
      }

      setIsSuccess(true);
      reset();
      if (honeypotRef.current) honeypotRef.current.value = "";
    } catch {
      setError(t("errorBody"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 p-8 text-center md:p-12"
        role="status"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface-2 text-text">
          <CheckCircle2 size={32} aria-hidden="true" />
        </div>
        <h3
          ref={successRef}
          tabIndex={-1}
          className="text-2xl font-semibold text-text outline-none"
        >
          {t("successTitle")}
        </h3>
        <p className="mt-2 max-w-md text-text-2">{t("successBody")}</p>
        <p className="mt-4 max-w-md font-medium text-text">{t("email.ackDelay")}</p>
        <p className="mt-4 max-w-md text-sm leading-6 text-text-2">{t("email.ackWhatsapp")}</p>
        <a
          href={LINKS.whatsapp}
          target="_blank"
          rel="noreferrer"
          className="mt-3 text-sm font-medium text-text underline decoration-border hover:decoration-text"
        >
          {t("successWhatsappLink")}
        </a>
        <button
          type="button"
          onClick={() => setIsSuccess(false)}
          className="mt-8 rounded-md bg-text px-6 py-2 text-sm font-medium text-bg hover:opacity-90"
        >
          {t("sendAnother")}
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
            <label htmlFor="organization" className="text-sm font-medium text-text-2">
              {t("fields.organization")}
            </label>
            <input
              {...register("organization")}
              id="organization"
              autoComplete="organization"
              aria-invalid={errors.organization ? true : undefined}
              aria-describedby={errors.organization ? "organization-error" : undefined}
              className={fieldClass(Boolean(errors.organization))}
            />
            {errors.organization && (
              <span id="organization-error" className="text-xs text-text-2">{errors.organization.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="contactName" className="text-sm font-medium text-text-2">
              {t("fields.contactName")}
            </label>
            <input
              {...register("contactName")}
              id="contactName"
              autoComplete="name"
              aria-invalid={errors.contactName ? true : undefined}
              aria-describedby={errors.contactName ? "contactName-error" : undefined}
              className={fieldClass(Boolean(errors.contactName))}
            />
            {errors.contactName && (
              <span id="contactName-error" className="text-xs text-text-2">{errors.contactName.message}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="whatsapp" className="text-sm font-medium text-text-2">
              {t("fields.whatsapp")}
            </label>
            <input
              {...register("whatsapp")}
              id="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              aria-invalid={errors.whatsapp ? true : undefined}
              aria-describedby="whatsapp-hint"
              className={fieldClass(Boolean(errors.whatsapp))}
            />
            <p id="whatsapp-hint" className="text-xs leading-5 text-text-2">{t("whatsappHint")}</p>
            {errors.whatsapp && (
              <span className="text-xs text-text-2">{errors.whatsapp.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-text-2">
              {t("fields.email")}
            </label>
            <input
              {...register("email")}
              id="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={fieldClass(Boolean(errors.email))}
            />
            {errors.email && (
              <span id="email-error" className="text-xs text-text-2">{errors.email.message}</span>
            )}
          </div>
        </div>

        <fieldset
          className="flex flex-col gap-3"
          aria-invalid={errors.contactPreference ? true : undefined}
          aria-describedby={errors.contactPreference ? "preference-error" : undefined}
        >
          <legend className="text-sm font-medium text-text-2">{t("fields.preference")}</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {PARTNER_CONTACT_PREFERENCES.map((preference) => (
              <label
                key={preference}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 text-sm text-text"
              >
                <input
                  {...register("contactPreference")}
                  type="radio"
                  value={preference}
                  className="h-4 w-4"
                />
                {t(`preferences.${preference}`)}
              </label>
            ))}
          </div>
          {errors.contactPreference && (
            <span id="preference-error" className="text-xs text-text-2">{errors.contactPreference.message}</span>
          )}
        </fieldset>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="city" className="text-sm font-medium text-text-2">
              {t("fields.city")}
            </label>
            <select
              {...register("city")}
              id="city"
              aria-invalid={errors.city ? true : undefined}
              aria-describedby={errors.city ? "city-error" : undefined}
              className={fieldClass(Boolean(errors.city))}
            >
              <option value="">{t("placeholders.city")}</option>
              {PARTNER_CITIES.map((value) => (
                <option key={value} value={value}>
                  {t(`cities.${value}`)}
                </option>
              ))}
            </select>
            {errors.city && (
              <span id="city-error" className="text-xs text-text-2">{errors.city.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="sector" className="text-sm font-medium text-text-2">
              {t("fields.sector")}
            </label>
            <select
              {...register("sector")}
              id="sector"
              aria-invalid={errors.sector ? true : undefined}
              aria-describedby={errors.sector ? "sector-error" : undefined}
              className={fieldClass(Boolean(errors.sector))}
            >
              <option value="">{t("placeholders.sector")}</option>
              {PARTNER_SECTORS.map((value) => (
                <option key={value} value={value}>
                  {t(`sectors.${value}`)}
                </option>
              ))}
            </select>
            {errors.sector && (
              <span id="sector-error" className="text-xs text-text-2">{errors.sector.message}</span>
            )}
          </div>
        </div>

        {diaspora && (
          <div className="flex flex-col gap-2">
            <label htmlFor="country" className="text-sm font-medium text-text-2">
              {t("fields.country")}
            </label>
            <input
              {...register("country")}
              id="country"
              autoComplete="country-name"
              aria-invalid={errors.country ? true : undefined}
              aria-describedby="country-hint"
              className={fieldClass(Boolean(errors.country))}
            />
            <p id="country-hint" className="text-xs leading-5 text-text-2">{t("countryHint")}</p>
            {errors.country && (
              <span className="text-xs text-text-2">{errors.country.message}</span>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="link" className="text-sm font-medium text-text-2">
            {t("fields.link")}
          </label>
          <input
            {...register("link")}
            id="link"
            type="url"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            placeholder="https://"
            aria-invalid={errors.link ? true : undefined}
            aria-describedby={errors.link ? "link-error" : undefined}
            className={fieldClass(Boolean(errors.link))}
          />
          {errors.link && (
            <span id="link-error" className="text-xs text-text-2">{errors.link.message}</span>
          )}
        </div>

        <fieldset
          className="flex flex-col gap-3"
          aria-invalid={errors.offers ? true : undefined}
          aria-describedby={errors.offers ? "offers-error" : undefined}
        >
          <legend className="text-sm font-medium text-text-2">{t("fields.offers")}</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PARTNER_OFFERS.map((offer) => (
              <label
                key={offer}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 text-sm text-text"
              >
                <input
                  {...register("offers")}
                  type="checkbox"
                  value={offer}
                  className="h-4 w-4"
                />
                {t(`offerNames.${offer}`)}
              </label>
            ))}
          </div>
          {errors.offers?.message && (
            <span id="offers-error" className="text-xs text-text-2">{errors.offers.message}</span>
          )}
        </fieldset>

        {venue && (
          <fieldset className="flex flex-col gap-5 rounded-md border border-border bg-bg p-4">
            <legend className="px-1 text-sm font-medium text-text">{t("venueHint")}</legend>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="capacity" className="text-sm font-medium text-text-2">
                  {t("fields.capacity")}
                </label>
                <input
                  {...register("capacity")}
                  id="capacity"
                  inputMode="numeric"
                  aria-invalid={errors.capacity ? true : undefined}
                  aria-describedby={errors.capacity ? "capacity-error" : undefined}
                  className={fieldClass(Boolean(errors.capacity))}
                />
                {errors.capacity && (
                  <span id="capacity-error" className="text-xs text-text-2">{errors.capacity.message}</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="wifi" className="text-sm font-medium text-text-2">
                  {t("fields.wifi")}
                </label>
                <input
                  {...register("wifi")}
                  id="wifi"
                  aria-invalid={errors.wifi ? true : undefined}
                  aria-describedby={errors.wifi ? "wifi-error" : undefined}
                  className={fieldClass(Boolean(errors.wifi))}
                />
                {errors.wifi && (
                  <span id="wifi-error" className="text-xs text-text-2">{errors.wifi.message}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="power" className="text-sm font-medium text-text-2">
                {t("fields.power")}
              </label>
              <select
                {...register("power")}
                id="power"
                aria-invalid={errors.power ? true : undefined}
                aria-describedby={errors.power ? "power-error" : undefined}
                className={fieldClass(Boolean(errors.power))}
              >
                <option value="">{t("placeholders.power")}</option>
                {PARTNER_POWER.map((value) => (
                  <option key={value} value={value}>
                    {t(`powerOptions.${value}`)}
                  </option>
                ))}
              </select>
              {errors.power && (
                <span id="power-error" className="text-xs text-text-2">{errors.power.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="av" className="text-sm font-medium text-text-2">
                {t("fields.av")}
              </label>
              <input
                {...register("av")}
                id="av"
                aria-invalid={errors.av ? true : undefined}
                aria-describedby={errors.av ? "av-error" : undefined}
                className={fieldClass(Boolean(errors.av))}
              />
              {errors.av && (
                <span id="av-error" className="text-xs text-text-2">{errors.av.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="availability" className="text-sm font-medium text-text-2">
                {t("fields.availability")}
              </label>
              <textarea
                {...register("availability")}
                id="availability"
                rows={3}
                aria-invalid={errors.availability ? true : undefined}
                aria-describedby={errors.availability ? "availability-error" : undefined}
                className={`resize-y ${fieldClass(Boolean(errors.availability))}`}
              />
              {errors.availability && (
                <span id="availability-error" className="text-xs text-text-2">{errors.availability.message}</span>
              )}
            </div>
          </fieldset>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="details" className="text-sm font-medium text-text-2">
            {t("fields.details")}
          </label>
          <textarea
            {...register("details")}
            id="details"
            rows={4}
            aria-invalid={errors.details ? true : undefined}
            aria-describedby={errors.details ? "details-error" : undefined}
            className={`resize-y ${fieldClass(Boolean(errors.details))}`}
          />
          {errors.details && (
            <span id="details-error" className="text-xs text-text-2">{errors.details.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <input
              {...register("consent")}
              id="partner-consent"
              type="checkbox"
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? "partner-consent-error" : undefined}
              className="mt-1 h-4 w-4 shrink-0 accent-text"
            />
            <div className="text-sm leading-6 text-text-2">
              <label htmlFor="partner-consent" className="cursor-pointer">
                {t("consentLead")}
              </label>{" "}
              <Link
                href="/privacy"
                className="font-medium text-text underline decoration-border hover:decoration-text"
              >
                {t("privacyLink")}
              </Link>
            </div>
          </div>
          {errors.consent && (
            <span id="partner-consent-error" className="text-xs text-text-2">{errors.consent.message}</span>
          )}
        </div>

        <InvisibleTurnstile ref={turnstileRef} />

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
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
              {t("formSending")}
            </>
          ) : (
            <>
              <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
              {t("formSubmit")}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
