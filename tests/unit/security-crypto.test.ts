import assert from "node:assert/strict";
import test from "node:test";

import {
  hashPassword,
  verifyPassword,
  signJwt,
  verifyJwt,
  decodeJwt,
  extractBearerToken,
} from "../../lib/security-crypto.ts";

test("hashPassword generates salted PBKDF2 hash and never stores plain text", async () => {
  const password = "SamaraSegura2026!";
  const hash1 = await hashPassword(password);
  const hash2 = await hashPassword(password);

  assert.match(hash1, /^pbkdf2:sha256:100000:[a-f0-9]{32}:[a-f0-9]{64}$/);
  assert.match(hash2, /^pbkdf2:sha256:100000:[a-f0-9]{32}:[a-f0-9]{64}$/);

  // Cada hash possui salt aleatório único diferente
  assert.notEqual(hash1, hash2);

  // A senha pura nunca deve estar visível no hash resultante
  assert.equal(hash1.includes(password), false);
});

test("verifyPassword validates correct passwords and rejects wrong ones", async () => {
  const original = "ClinicaDraSamara#123";
  const hash = await hashPassword(original);

  const isValid = await verifyPassword(original, hash);
  assert.equal(isValid, true);

  const isInvalid = await verifyPassword("SenhaIncorreta999", hash);
  assert.equal(isInvalid, false);

  const isBlank = await verifyPassword("", hash);
  assert.equal(isBlank, false);
});

test("verifyPassword gracefully handles corrupt or malformed hashes", async () => {
  assert.equal(await verifyPassword("pass", "invalid-hash-string"), false);
  assert.equal(await verifyPassword("pass", "pbkdf2:sha256:invalid"), false);
  assert.equal(await verifyPassword("pass", ""), false);
});

test("signJwt generates valid HS256 tokens and verifyJwt decodes verified payload", async () => {
  const secret = "chave-secreta-teste-unitario-123456789";
  const payload = {
    sub: "uid-samara-001",
    email: "samara-nagy@hotmail.com",
    role: "admin" as const,
    name: "Dra. Sâmara Souza",
  };

  const token = await signJwt(payload, secret, 3600);
  assert.equal(typeof token, "string");
  assert.equal(token.split(".").length, 3);

  const verified = await verifyJwt(token, secret);
  assert.ok(verified);
  assert.equal(verified?.sub, "uid-samara-001");
  assert.equal(verified?.email, "samara-nagy@hotmail.com");
  assert.equal(verified?.role, "admin");
  assert.equal(verified?.name, "Dra. Sâmara Souza");
  assert.ok(typeof verified?.exp === "number");
});

test("verifyJwt rejects tampered tokens or wrong secret", async () => {
  const secret = "chave-secreta-teste-unitario-123456789";
  const payload = {
    sub: "uid-colab-002",
    email: "recepcao@samaraestetica.com.br",
    role: "funcionaria" as const,
  };

  const token = await signJwt(payload, secret, 3600);

  // Tentativa com chave errada
  const wrongSecretResult = await verifyJwt(token, "outra-chave-qualquer");
  assert.equal(wrongSecretResult, null);

  // Tentativa com payload adulterado
  const parts = token.split(".");
  const tamperedToken = `${parts[0]}.${parts[1]}xyz.${parts[2]}`;
  const tamperedResult = await verifyJwt(tamperedToken, secret);
  assert.equal(tamperedResult, null);
});

test("verifyJwt rejects expired tokens", async () => {
  const secret = "chave-secreta-teste-unitario-123456789";
  const payload = {
    sub: "uid-expired",
    email: "expirado@teste.com",
    role: "funcionaria" as const,
  };

  // Expira no passado (-10 segundos)
  const expiredToken = await signJwt(payload, secret, -10);
  const result = await verifyJwt(expiredToken, secret);
  assert.equal(result, null);
});

test("decodeJwt reads token claims without signature verification", async () => {
  const secret = "chave-secreta-qualquer";
  const payload = {
    sub: "uid-777",
    email: "dra.samara@samaraestetica.com.br",
    role: "admin" as const,
  };

  const token = await signJwt(payload, secret);
  const decoded = decodeJwt(token);
  assert.ok(decoded);
  assert.equal(decoded?.sub, "uid-777");
  assert.equal(decoded?.email, "dra.samara@samaraestetica.com.br");
});

test("extractBearerToken parses Bearer header and cookies correctly", () => {
  assert.equal(
    extractBearerToken("Bearer eyJhbGciOiJIUzI1NiJ9.abc.def"),
    "eyJhbGciOiJIUzI1NiJ9.abc.def"
  );
  assert.equal(
    extractBearerToken("bearer eyJhbGciOiJIUzI1NiJ9.abc.def"),
    "eyJhbGciOiJIUzI1NiJ9.abc.def"
  );
  assert.equal(
    extractBearerToken("other_cookie=123; samara_jwt=eyJhbGciOiJIUzI1NiJ9.tok; path=/"),
    "eyJhbGciOiJIUzI1NiJ9.tok"
  );
  assert.equal(extractBearerToken(null), null);
  assert.equal(extractBearerToken(undefined), null);
});
