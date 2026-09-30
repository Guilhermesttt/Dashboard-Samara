import assert from "node:assert/strict";
import test from "node:test";

import { STORAGE_KEYS, isProduction } from "../../lib/storage-keys.ts";

test("environment keys isolation respects environment prefix", () => {
  const prefix = isProduction ? "samara_prod_" : "samara_dev_";
  assert.equal(STORAGE_KEYS.APPOINTMENTS.startsWith(prefix), true);
  assert.equal(STORAGE_KEYS.PATIENTS.startsWith(prefix), true);
  assert.equal(STORAGE_KEYS.USER_PROFILE.startsWith(prefix), true);
  assert.equal(STORAGE_KEYS.CLINIC_SCHEDULE.startsWith(prefix), true);
  assert.equal(STORAGE_KEYS.ONBOARDING_DONE.startsWith(prefix), true);
});

test("anti-duplication algorithm correctly identifies existing returns", () => {
  const existingList = [
    {
      id: "apt-1",
      patientName: "Marcia",
      type: "Aplicação",
      status: "concluido",
    },
    {
      id: "apt-ret-1",
      patientName: "Marcia",
      type: "Retorno de 15 Dias",
      status: "agendado",
      originAppointmentId: "apt-1",
    },
  ];

  // Checagem se um retorno já existe para a paciente
  const candidatePatient = "Marcia";
  const candidateOriginId = "apt-1";

  const alreadyExists = existingList.some(
    (a) =>
      a.type === "Retorno de 15 Dias" &&
      (a.originAppointmentId === candidateOriginId ||
        a.patientName.toLowerCase().trim() === candidatePatient.toLowerCase().trim())
  );

  assert.equal(alreadyExists, true);

  // Para outra paciente não deve existir
  const nonExisting = existingList.some(
    (a) =>
      a.type === "Retorno de 15 Dias" &&
      a.patientName.toLowerCase().trim() === "Camila Silva".toLowerCase().trim()
  );

  assert.equal(nonExisting, false);
});

test("findStoredAccount and updateStoredAccount correctly manage user records with PBKDF2 hashes", async () => {
  const store = new Map<string, string>();
  (globalThis as any).window = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
  };

  const { saveRegisteredUser, findStoredAccount, updateStoredAccount } = await import(
    "../../lib/storage-keys.ts"
  );

  const res = await saveRegisteredUser({
    name: "Dra. Sâmara Souza",
    email: "dra.samara@samaraestetica.com.br",
    password: "SenhaCorreta2026",
    role: "admin",
  });
  assert.equal(res.success, true);

  const found = findStoredAccount("dra.samara@samaraestetica.com.br");
  assert.ok(found);
  assert.equal(found?.name, "Dra. Sâmara Souza");
  assert.equal(found?.role, "admin");
  assert.match(found?.passwordHash || "", /^pbkdf2:sha256:100000:/);

  // Tentativa de duplicar o mesmo e-mail deve falhar
  const duplicate = await saveRegisteredUser({
    name: "Outra",
    email: "DRA.SAMARA@samaraestetica.com.br",
    password: "OutraSenha",
  });
  assert.equal(duplicate.success, false);

  // Atualizar hash de senha com updateStoredAccount
  const updated = updateStoredAccount("dra.samara@samaraestetica.com.br", {
    passwordHash: "pbkdf2:sha256:100000:salt:newhash",
  });
  assert.equal(updated, true);
  const foundUpdated = findStoredAccount("dra.samara@samaraestetica.com.br");
  assert.equal(foundUpdated?.passwordHash, "pbkdf2:sha256:100000:salt:newhash");

  // Limpar mocks
  delete (globalThis as any).window;
  delete (globalThis as any).localStorage;
});
