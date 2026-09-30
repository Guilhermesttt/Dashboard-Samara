/**
 * Utilitário central de chaves de armazenamento com isolamento de ambiente (Dev vs Prod).
 * Em desenvolvimento, usa prefixo `samara_dev_` para não poluir os dados reais da clínica.
 * Em produção, utiliza `samara_prod_` garantindo um ambiente limpo e zerado no primeiro acesso.
 */

export const isProduction = process.env.NODE_ENV === "production";
const PREFIX = isProduction ? "samara_prod_" : "samara_dev_";

export const STORAGE_KEYS = {
  APPOINTMENTS: `${PREFIX}appointments`,
  PATIENTS: `${PREFIX}patients`,
  AUTH_SESSION: `${PREFIX}auth_session`,
  AUTH_USERS: `${PREFIX}auth_users`,
  USER_PROFILE: `${PREFIX}user_profile`,
  CLINIC_SCHEDULE: `${PREFIX}clinic_schedule`,
  ONBOARDING_DONE: `${PREFIX}onboarding_done`,
  LEGACY_APPOINTMENTS: "samara_real_appointments",
  LEGACY_PATIENTS: "samara_real_patients",
};

/**
 * Lê agendamentos preservando retrocompatibilidade com dados locais durante dev.
 */
export function getStoredAppointments(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (raw) return JSON.parse(raw);
    // Fallback retrocompatível para ambiente dev
    if (!isProduction) {
      const legacy = localStorage.getItem(STORAGE_KEYS.LEGACY_APPOINTMENTS);
      if (legacy) return JSON.parse(legacy);
    }
  } catch (e) {
    console.error("Erro ao ler agendamentos:", e);
  }
  return [];
}

/**
 * Salva agendamentos na chave isolada do ambiente.
 */
export function setStoredAppointments(apts: any[]): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(apts);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, serialized);
    if (!isProduction) {
      localStorage.setItem(STORAGE_KEYS.LEGACY_APPOINTMENTS, serialized);
    }
    window.dispatchEvent(new Event("samara_appointments_updated"));
  } catch (e) {
    console.error("Erro ao salvar agendamentos:", e);
  }
}

/**
 * Lê pacientes do ambiente.
 */
export function getStoredPatients(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    if (raw) return JSON.parse(raw);
    if (!isProduction) {
      const legacy = localStorage.getItem(STORAGE_KEYS.LEGACY_PATIENTS);
      if (legacy) return JSON.parse(legacy);
    }
  } catch (e) {
    console.error("Erro ao ler pacientes:", e);
  }
  return [];
}

/**
 * Salva pacientes na chave isolada do ambiente.
 */
export function setStoredPatients(patients: any[]): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(patients);
    localStorage.setItem(STORAGE_KEYS.PATIENTS, serialized);
    if (!isProduction) {
      localStorage.setItem(STORAGE_KEYS.LEGACY_PATIENTS, serialized);
    }
    window.dispatchEvent(new Event("samara_patients_updated"));
  } catch (e) {
    console.error("Erro ao salvar pacientes:", e);
  }
}

export interface UserProfileData {
  name: string;
  email: string;
  title?: string;
  crm?: string;
  phone?: string;
  photoUrl?: string;
  bio?: string;
}

export interface ClinicScheduleData {
  startHour: string;
  endHour: string;
  appointmentDurationMinutes: number;
  workDays: string[];
}

export const DEFAULT_CLINIC_SCHEDULE: ClinicScheduleData = {
  startHour: "08:00",
  endHour: "18:00",
  appointmentDurationMinutes: 60,
  workDays: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
};

export function getStoredUserProfile(): UserProfileData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function setStoredUserProfile(profile: UserProfileData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    window.dispatchEvent(new Event("samara_profile_updated"));
  } catch (e) {}
}

export function getStoredClinicSchedule(): ClinicScheduleData {
  if (typeof window === "undefined") return DEFAULT_CLINIC_SCHEDULE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLINIC_SCHEDULE);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_CLINIC_SCHEDULE;
}

export function setStoredClinicSchedule(schedule: ClinicScheduleData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.CLINIC_SCHEDULE, JSON.stringify(schedule));
    window.dispatchEvent(new Event("samara_schedule_updated"));
  } catch (e) {}
}

/**
 * Zera completamente os dados de teste locais sem afetar procedimentos ou credenciais.
 */
export function clearDevTestData(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEYS.PATIENTS);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_PATIENTS);
    window.dispatchEvent(new Event("samara_appointments_updated"));
    window.dispatchEvent(new Event("samara_patients_updated"));
  } catch (e) {
    console.error("Erro ao zerar dados de teste:", e);
  }
}

export interface UserAccount {
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

export function getStoredAccounts(): UserAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveRegisteredUser(account: {
  name: string;
  email: string;
  password: string;
}): { success: boolean; error?: string } {
  if (typeof window === "undefined") return { success: false, error: "Ambiente inválido" };
  try {
    const accounts = getStoredAccounts();
    const cleanEmail = account.email.trim().toLowerCase();
    
    // Verifica se já existe
    const exists = accounts.some((a) => a.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: false, error: "Já existe uma conta cadastrada com este e-mail." };
    }

    const newAcc: UserAccount = {
      name: account.name.trim(),
      email: cleanEmail,
      password: account.password,
      createdAt: new Date().toISOString(),
    };

    accounts.push(newAcc);
    localStorage.setItem(STORAGE_KEYS.AUTH_USERS, JSON.stringify(accounts));
    return { success: true };
  } catch (e) {
    return { success: false, error: "Falha ao salvar conta localmente." };
  }
}

