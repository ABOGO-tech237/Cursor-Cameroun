import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { partners } from "@/data/partners";
import {
  PARTNER_LOGO_MAX_BYTES,
  displayablePartnerLogo,
  partnerLogoPublicPath,
  publicFileSize,
} from "./logo";

const authorized = {
  name: "Hub",
  city: "Douala",
  sector: "Coworking",
  href: "https://example.com",
  offers: ["venue"] as const,
  logoAuthorization: "Accord écrit du 10 octobre 2026",
  logo: "/partners/hub.svg",
};

describe("partner logos", () => {
  it("la vitrine livrée est vide", () => {
    assert.deepEqual(partners, []);
  });

  it("n'affiche rien sans autorisation, même si un fichier est indiqué", () => {
    assert.equal(
      partnerLogoPublicPath({ ...authorized, logoAuthorization: "  " }),
      null,
    );
    assert.equal(
      displayablePartnerLogo({ ...authorized, logoAuthorization: "" }, () => 100),
      null,
    );
  });

  it("n'accepte qu'un SVG ou un WebP local de moins de 30 Ko", () => {
    assert.equal(partnerLogoPublicPath({ ...authorized, logo: "/partners/hub.png" }), null);
    assert.equal(partnerLogoPublicPath({ ...authorized, logo: "https://cdn.example/a.svg" }), null);
    assert.equal(partnerLogoPublicPath({ ...authorized, logo: "/partners/../secret.svg" }), null);
    assert.equal(partnerLogoPublicPath(authorized), "/partners/hub.svg");

    assert.equal(
      displayablePartnerLogo(authorized, () => PARTNER_LOGO_MAX_BYTES),
      null,
    );
    assert.equal(
      displayablePartnerLogo(
        { ...authorized, logo: "/partners/hub.webp" },
        () => PARTNER_LOGO_MAX_BYTES - 1,
      ),
      "/partners/hub.webp",
    );
    assert.equal(displayablePartnerLogo(authorized, () => null), null);
  });

  it("ne trouve pas de fichier logo inventé dans public/", () => {
    assert.equal(publicFileSize("/partners/inexistant.svg"), null);
  });
});
