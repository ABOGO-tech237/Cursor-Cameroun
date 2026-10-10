"use client";

import { useEffect } from "react";

/** La mise en page racine ne se re-rend pas lors d'un changement de locale. */
export function DocumentLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
