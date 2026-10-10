import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { escapeHtml, sanitizeHeader } from "./escape-html";

describe("escapeHtml", () => {
  it("échappe les caractères HTML", () => {
    assert.equal(
      escapeHtml(`<script>alert("x")</script> & 'y'`),
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;",
    );
  });

  it("laisse un texte neutre inchangé", () => {
    assert.equal(escapeHtml("Bonjour Ada"), "Bonjour Ada");
  });
});

describe("sanitizeHeader", () => {
  it("retire les retours ligne", () => {
    assert.equal(sanitizeHeader("Hello\r\nBcc: evil@example.com"), "Hello Bcc: evil@example.com");
  });
});
