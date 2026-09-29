import assert from "node:assert/strict"
import test from "node:test"

import {
  ALAGOAS_MUNICIPALITIES,
  DEFAULT_ALAGOAS_LOCATION,
} from "../../lib/alagoas-municipalities.ts"
import {
  calculateAgeFromBirthDate,
  formatCpf,
  formatPhone,
  isCompleteCpf,
  isCompletePhone,
  normalizeAlagoasLocation,
} from "../../lib/customer-input.ts"

test("formats and limits CPF progressively", () => {
  assert.equal(formatCpf("12345678901"), "123.456.789-01")
  assert.equal(formatCpf("123.456.789-0199"), "123.456.789-01")
  assert.equal(formatCpf("1234"), "123.4")
})

test("formats and limits Brazilian phone numbers", () => {
  assert.equal(formatPhone("8234567890"), "(82) 3456-7890")
  assert.equal(formatPhone("82987654321"), "(82) 98765-4321")
  assert.equal(formatPhone("(82) 98765-432199"), "(82) 98765-4321")
})

test("validates complete formatted contact fields", () => {
  assert.equal(isCompleteCpf("123.456.789-01"), true)
  assert.equal(isCompleteCpf("123.456"), false)
  assert.equal(isCompletePhone("(82) 3456-7890"), true)
  assert.equal(isCompletePhone("(82) 98765-4321"), true)
})

test("exposes exactly the official Alagoas municipalities", () => {
  assert.equal(ALAGOAS_MUNICIPALITIES.length, 102)
  assert.equal(new Set(ALAGOAS_MUNICIPALITIES).size, 102)
  assert.equal(DEFAULT_ALAGOAS_LOCATION, "Maceió, AL")
})

test("normalizes only supported Alagoas locations", () => {
  assert.equal(normalizeAlagoasLocation("Arapiraca, AL"), "Arapiraca, AL")
  assert.equal(normalizeAlagoasLocation("São Paulo, SP"), "")
})

test("calculates age from a valid Brazilian date", () => {
  assert.equal(calculateAgeFromBirthDate("15/05/1994", new Date(2026, 8, 29)), 32)
  assert.equal(calculateAgeFromBirthDate("", new Date(2026, 8, 29)), 0)
})
