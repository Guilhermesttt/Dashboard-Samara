import { ALAGOAS_LOCATIONS } from "./alagoas-municipalities.ts"

const digitsOnly = (value: string, limit: number) =>
  value.replace(/\D/g, "").slice(0, limit)

export function formatCpf(value: string): string {
  const digits = digitsOnly(value, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function formatPhone(value: string): string {
  const digits = digitsOnly(value, 11)

  if (!digits) return ""
  if (digits.length < 3) return `(${digits}`

  const areaCode = digits.slice(0, 2)
  const local = digits.slice(2)
  const prefixLength = digits.length === 11 ? 5 : Math.min(4, local.length)
  const prefix = local.slice(0, prefixLength)
  const suffix = local.slice(prefixLength)

  return `(${areaCode}) ${prefix}${suffix ? `-${suffix}` : ""}`
}

export function isCompleteCpf(value: string): boolean {
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value)
}

export function isCompletePhone(value: string): boolean {
  return /^\(\d{2}\) (?:\d{4}-\d{4}|\d{5}-\d{4})$/.test(value)
}

export function normalizeAlagoasLocation(value: string): string {
  const normalized = value.trim()

  if (ALAGOAS_LOCATIONS.includes(normalized)) return normalized

  const byMunicipality = ALAGOAS_LOCATIONS.find(
    (location) => location.slice(0, -4) === normalized,
  )

  return byMunicipality ?? ""
}

export function calculateAgeFromBirthDate(
  value: string,
  today = new Date(),
): number {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return 0

  const [, dayText, monthText, yearText] = match
  const day = Number(dayText)
  const month = Number(monthText)
  const year = Number(yearText)
  const birthDate = new Date(year, month - 1, day)

  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day ||
    birthDate > today
  ) {
    return 0
  }

  let age = today.getFullYear() - year
  const birthdayHasPassed =
    today.getMonth() > month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() >= day)

  if (!birthdayHasPassed) age -= 1

  return Math.max(0, age)
}
