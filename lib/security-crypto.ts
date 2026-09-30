// ==============================================================
// SERVIÇO DE CRIPTOGRAFIA & TOKENS JWT (DRA. SÂMARA SOUZA)
// ==============================================================
// Regra de Ouro da Aplicação:
// 1. Senhas NUNCA são salvas em texto puro em nenhum banco ou storage.
// 2. Senhas usam PBKDF2 com HMAC-SHA256, 100.000 iterações e salt criptográfico individual.
// 3. Sessões utilizam tokens JWT assinados com HMAC-SHA256 (HS256) via Web Crypto API nativa.

export interface JwtPayload {
  sub: string;
  email: string;
  role: "admin" | "funcionaria";
  name?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

const DEFAULT_JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.NEXT_PUBLIC_JWT_SECRET ||
  "samara-estetica-avancada-secret-key-2026-auth-jwt";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa !== "undefined") {
    return btoa(binary)
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }
  // Fallback para ambientes Node puros caso btoa não esteja global
  return Buffer.from(bytes).toString("base64url");
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  if (typeof atob !== "undefined") {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  // Fallback para Buffer
  return new Uint8Array(Buffer.from(str, "base64"));
}

/**
 * Obtém a chave secreta de assinatura JWT
 */
export function getJwtSecret(): string {
  return DEFAULT_JWT_SECRET;
}

// ==============================================================
// 1. HASH CRIPTOGRÁFICO DE SENHAS (PBKDF2 + SHA-256 + SALT)
// ==============================================================

/**
 * Gera um hash criptográfico seguro para a senha utilizando PBKDF2, HMAC-SHA256,
 * 100.000 iterações e salt aleatório de 16 bytes.
 * Retorna no formato padronizado: `pbkdf2:sha256:100000:<saltHex>:<hashHex>`
 */
export async function hashPassword(password: string): Promise<string> {
  const cleanPassword = password.trim();
  if (!cleanPassword) {
    throw new Error("A senha não pode ser vazia para geração de hash.");
  }

  // Gera salt aleatório criptograficamente seguro de 16 bytes (128 bits)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(cleanPassword),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    true,
    ["sign"]
  );

  const exported = await crypto.subtle.exportKey("raw", derivedKey);
  const hashHex = Array.from(new Uint8Array(exported))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `pbkdf2:sha256:100000:${saltHex}:${hashHex}`;
}

/**
 * Verifica se a senha fornecida bate com o hash PBKDF2 armazenado.
 * Utiliza comparação estrita em tempo constante para evitar ataques de temporização (timing attacks).
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  if (!password || !storedHash) return false;

  const parts = storedHash.split(":");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") {
    return false;
  }

  const iterations = parseInt(parts[2], 10);
  const saltHex = parts[3];
  const expectedHashHex = parts[4];

  if (!saltHex || !expectedHashHex || isNaN(iterations)) return false;

  const saltMatches = saltHex.match(/.{1,2}/g);
  if (!saltMatches) return false;
  const salt = new Uint8Array(saltMatches.map((byte) => parseInt(byte, 16)));

  try {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      textEncoder.encode(password.trim()),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "HMAC", hash: "SHA-256", length: 256 },
      true,
      ["sign"]
    );

    const exported = await crypto.subtle.exportKey("raw", derivedKey);
    const computedHashHex = Array.from(new Uint8Array(exported))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Comparação de comprimento fixo (evita timing attacks)
    if (computedHashHex.length !== expectedHashHex.length) {
      return false;
    }

    let mismatch = 0;
    for (let i = 0; i < computedHashHex.length; i++) {
      mismatch |= computedHashHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
    }
    return mismatch === 0;
  } catch (err) {
    console.error("Erro ao verificar hash de senha:", err);
    return false;
  }
}

// ==============================================================
// 2. TOKENS JWT (JSON WEB TOKENS) COM ASSINATURA HMAC-SHA256
// ==============================================================

/**
 * Assina e emite um novo token JWT estruturado (Header.Payload.Signature)
 * com algoritmo HS256 e expiração configurável (padrão: 24 horas).
 */
export async function signJwt(
  payload: Omit<JwtPayload, "iat" | "exp">,
  secret: string = getJwtSecret(),
  expiresInSeconds: number = 24 * 60 * 60
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  } as JwtPayload;

  const encodedHeader = base64UrlEncode(
    textEncoder.encode(JSON.stringify(header))
  );
  const encodedPayload = base64UrlEncode(
    textEncoder.encode(JSON.stringify(fullPayload))
  );

  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    textEncoder.encode(dataToSign)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Valida a integridade, a assinatura criptográfica e a data de expiração de um JWT.
 * Retorna o payload decodificado se válido, ou `null` se inválido/expirado/adulterado.
 */
export async function verifyJwt(
  token: string | null | undefined,
  secret: string = getJwtSecret()
): Promise<JwtPayload | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  try {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      textEncoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureBytes = base64UrlDecode(encodedSignature);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      signatureBytes as unknown as BufferSource,
      textEncoder.encode(dataToSign)
    );

    if (!isValid) {
      return null;
    }

    const payloadJson = textDecoder.decode(base64UrlDecode(encodedPayload));
    const payload = JSON.parse(payloadJson) as JwtPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      // Token expirado
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Decodifica o payload de um token JWT sem validar a assinatura (útil para leitura de dados no client-side)
 */
export function decodeJwt(token: string | null | undefined): JwtPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;

  try {
    const payloadJson = textDecoder.decode(base64UrlDecode(parts[1]));
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extrai o token de um header 'Authorization: Bearer <token>' ou de um cookie
 */
export function extractBearerToken(
  authHeaderOrCookie: string | null | undefined
): string | null {
  if (!authHeaderOrCookie) return null;

  const trimmed = authHeaderOrCookie.trim();
  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.substring(7).trim();
  }

  // Se veio no formato de cookie 'samara_jwt=...'
  if (trimmed.includes("samara_jwt=")) {
    const match = trimmed.match(/samara_jwt=([^;]+)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return trimmed;
}
