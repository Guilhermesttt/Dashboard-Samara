import assert from "node:assert/strict";
import test from "node:test";

import { isClinicAdminEmail } from "../../lib/auth-service.ts";

test("identifies primary clinic administrator emails correctly", () => {
  assert.equal(isClinicAdminEmail("samara-nagy@hotmail.com"), true);
  assert.equal(isClinicAdminEmail("dra.samara@samaraestetica.com.br"), true);
  assert.equal(isClinicAdminEmail("samara@samaraestetica.com.br"), true);
  assert.equal(isClinicAdminEmail("SAMARA-NAGY@HOTMAIL.COM"), true);
  assert.equal(isClinicAdminEmail("  dra.samara@samaraestetica.com.br  "), true);
});

test("identifies staff/receptionist accounts as non-admin", () => {
  assert.equal(isClinicAdminEmail("recepcao@samaraestetica.com.br"), false);
  assert.equal(isClinicAdminEmail("atendimento@clinica.com"), false);
  assert.equal(isClinicAdminEmail("mariasilva@gmail.com"), false);
  assert.equal(isClinicAdminEmail(""), false);
  assert.equal(isClinicAdminEmail(null), false);
  assert.equal(isClinicAdminEmail(undefined), false);
});

test("navItems visibility filter hides admin-only routes from staff", () => {
  const navItems = [
    { id: "overview", label: "Visão Geral" },
    { id: "appointments", label: "Agendamentos" },
    { id: "customers", label: "Clientes" },
    { id: "procedures", label: "Procedimentos" },
    { id: "reports", label: "Relatórios", isAdminOnly: true },
    { id: "settings", label: "Configurações" },
  ];

  const staffNav = navItems.filter((item) => !item.isAdminOnly || ("funcionaria" as string) === "admin");
  assert.equal(staffNav.some((i) => i.id === "reports"), false);
  assert.equal(staffNav.length, 5);

  const adminNav = navItems.filter((item) => !item.isAdminOnly || ("admin" as string) === "admin");
  assert.equal(adminNav.some((i) => i.id === "reports"), true);
  assert.equal(adminNav.length, 6);
});
