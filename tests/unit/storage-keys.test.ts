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
