/**
 * Procedures and Categories Domain Service.
 * Manages procedures catalog, custom categories, and persistent local/cloud storage.
 */

import { isFirebaseConfigured, db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
} from "firebase/firestore";

export interface ProcedureItem {
  id: string;
  name: string;
  category: string;
  price: number;
  observation?: string;
  active: boolean;
}

export const DEFAULT_PROCEDURE_CATEGORIES: string[] = [
  "Facial",
  "Corporal",
  "Facial/Corporal",
];

export const INITIAL_PROCEDURES: ProcedureItem[] = [
  {
    id: "proc-1",
    name: "Botox",
    category: "Facial",
    price: 900,
    observation: "Aplicação preventiva ou reparadora em terço superior",
    active: true,
  },
  {
    id: "proc-2",
    name: "Preenchimento Labial",
    category: "Facial",
    price: 1100,
    observation: "Ácido hialurônico para contorno e volumização labial",
    active: true,
  },
  {
    id: "proc-3",
    name: "Rinomodelação",
    category: "Facial",
    price: 1300,
    observation: "Harmonização do dorso e ponta nasal sem cirurgia",
    active: true,
  },
  {
    id: "proc-4",
    name: "Preenchedor em outras áreas",
    category: "Facial",
    price: 900,
    observation: "valor por ml",
    active: true,
  },
  {
    id: "proc-5",
    name: "Microagulhamento",
    category: "Facial",
    price: 400,
    observation: "Indução percutânea de colágeno com drug delivery",
    active: true,
  },
  {
    id: "proc-6",
    name: "Bioestimulador de Colágeno",
    category: "Facial/Corporal",
    price: 1800,
    observation: "Radiesse / Sculptra / Elleva para firmeza tecidual",
    active: true,
  },
  {
    id: "proc-7",
    name: "Fios de PDO",
    category: "Facial",
    price: 800,
    observation: "Fios lisos de estímulo ou tração para efeito lifting",
    active: true,
  },
];

const STORAGE_KEYS = {
  CATEGORIES: "samara_procedure_categories",
  PROCEDURES: "samara_procedures",
};

// ==========================================
// 1. LOCAL STORAGE
// ==========================================

export function getLocalCategories(): string[] {
  if (typeof window === "undefined") return DEFAULT_PROCEDURE_CATEGORIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) return DEFAULT_PROCEDURE_CATEGORIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error("Erro ao ler categorias de procedimentos locais:", e);
  }
  return DEFAULT_PROCEDURE_CATEGORIES;
}

export function saveLocalCategories(categories: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    window.dispatchEvent(new Event("samara_categories_updated"));
  } catch (e) {
    console.error("Erro ao salvar categorias locais:", e);
  }
}

export function getLocalProcedures(): ProcedureItem[] {
  if (typeof window === "undefined") return INITIAL_PROCEDURES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROCEDURES);
    if (!raw) return INITIAL_PROCEDURES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error("Erro ao ler procedimentos locais:", e);
  }
  return INITIAL_PROCEDURES;
}

export function saveLocalProcedures(procedures: ProcedureItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROCEDURES, JSON.stringify(procedures));
    window.dispatchEvent(new Event("samara_procedures_updated"));
  } catch (e) {
    console.error("Erro ao salvar procedimentos locais:", e);
  }
}

// ==========================================
// 2. FIRESTORE SYNC
// ==========================================

export async function fetchProceduresFromFirestore(): Promise<ProcedureItem[] | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const q = query(collection(db, "procedures"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as ProcedureItem[];
  } catch (error) {
    console.warn("Erro ao buscar procedimentos do Firestore:", error);
    return null;
  }
}

export async function saveProcedureToFirestore(proc: ProcedureItem): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const ref = doc(db, "procedures", proc.id);
    await setDoc(ref, JSON.parse(JSON.stringify(proc)), { merge: true });
    return true;
  } catch (error) {
    console.warn("Erro ao salvar procedimento no Firestore:", error);
    return false;
  }
}

export async function deleteProcedureFromFirestore(id: string): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const ref = doc(db, "procedures", id);
    await deleteDoc(ref);
    return true;
  } catch (error) {
    console.warn("Erro ao excluir procedimento do Firestore:", error);
    return false;
  }
}

export async function fetchCategoriesFromFirestore(): Promise<string[] | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const ref = doc(db, "clinic_settings", "procedure_categories");
    const docSnap = await getDocs(query(collection(db, "clinic_settings")));
    const found = docSnap.docs.find((d) => d.id === "procedure_categories");
    if (found && Array.isArray(found.data()?.list)) {
      return found.data().list;
    }
    return null;
  } catch (error) {
    console.warn("Erro ao buscar categorias do Firestore:", error);
    return null;
  }
}

export async function saveCategoriesToFirestore(categories: string[]): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const ref = doc(db, "clinic_settings", "procedure_categories");
    await setDoc(ref, { list: categories, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.warn("Erro ao salvar categorias no Firestore:", error);
    return false;
  }
}
