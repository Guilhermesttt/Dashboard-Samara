"use client";

import { db, isFirebaseConfigured } from "./firebase";
import { collection, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";

export interface ReminderItem {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // Ex: "Hoje", "Amanhã" ou "29/09/2026"
  dueTime?: string; // Ex: "14:30"
  patientName?: string;
  patientPhone?: string;
  priority: "alta" | "normal";
  notifyApp: boolean;
  notifyEmail: boolean;
  completed: boolean;
  createdAt: string;
}

const STORAGE_KEY = "samara_reminders";

export function getLocalReminders(): ReminderItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveLocalReminders(reminders: ReminderItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch (e) {}
}

export async function saveReminderToFirestore(reminder: ReminderItem): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const ref = doc(db, "reminders", reminder.id);
    await setDoc(ref, reminder, { merge: true });
  } catch (e) {
    console.warn("Erro ao salvar lembrete no Firestore:", e);
  }
}

export async function deleteReminderFromFirestore(reminderId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const ref = doc(db, "reminders", reminderId);
    await deleteDoc(ref);
  } catch (e) {
    console.warn("Erro ao deletar lembrete no Firestore:", e);
  }
}

export async function fetchRemindersFromFirestore(): Promise<ReminderItem[] | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const snap = await getDocs(collection(db, "reminders"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ReminderItem[];
  } catch (e) {
    console.warn("Erro ao buscar lembretes do Firestore:", e);
    return null;
  }
}
