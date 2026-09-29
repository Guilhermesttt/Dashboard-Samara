import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { PatientRecord } from "@/components/dashboard/sections/customer-profile-modal";
import { Appointment } from "@/components/dashboard/sections/appointments";

const COLLECTIONS = {
  PATIENTS: "patients",
  APPOINTMENTS: "appointments",
  PROCEDURES: "procedures",
  SETTINGS: "clinic_settings",
};

// ==========================================
// 1. PACIENTES / CLIENTES
// ==========================================

export async function fetchPatientsFromFirestore(): Promise<PatientRecord[] | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const q = query(collection(db, COLLECTIONS.PATIENTS));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as PatientRecord[];
  } catch (error) {
    console.error("Erro ao carregar pacientes do Firestore:", error);
    return null;
  }
}

export async function savePatientToFirestore(patient: PatientRecord): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const patientRef = doc(db, COLLECTIONS.PATIENTS, patient.id);
    await setDoc(patientRef, JSON.parse(JSON.stringify(patient)), { merge: true });
    return true;
  } catch (error) {
    console.error("Erro ao salvar paciente no Firestore:", error);
    return false;
  }
}

export async function deletePatientFromFirestore(patientId: string): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PATIENTS, patientId));
    return true;
  } catch (error) {
    console.error("Erro ao deletar paciente do Firestore:", error);
    return false;
  }
}

export function subscribeToPatients(
  onData: (patients: PatientRecord[]) => void
): Unsubscribe | null {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const q = query(collection(db, COLLECTIONS.PATIENTS));
    return onSnapshot(
      q,
      (snapshot) => {
        const patients = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PatientRecord[];
        onData(patients);
      },
      (error) => {
        console.warn(
          "[Firebase Firestore] Listener de pacientes pausado:",
          error.message
        );
      }
    );
  } catch (error) {
    console.warn("Erro ao assinar pacientes do Firestore:", error);
    return null;
  }
}

// ==========================================
// 2. AGENDAMENTOS / FLUXO KANBAN
// ==========================================

export async function fetchAppointmentsFromFirestore(): Promise<Appointment[] | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const q = query(collection(db, COLLECTIONS.APPOINTMENTS));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Appointment[];
  } catch (error) {
    console.error("Erro ao carregar agendamentos do Firestore:", error);
    return null;
  }
}

export async function saveAppointmentToFirestore(appointment: Appointment): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const aptRef = doc(db, COLLECTIONS.APPOINTMENTS, appointment.id);
    await setDoc(aptRef, JSON.parse(JSON.stringify(appointment)), { merge: true });
    return true;
  } catch (error) {
    console.error("Erro ao salvar agendamento no Firestore:", error);
    return false;
  }
}

export async function updateAppointmentStatusInFirestore(
  appointmentId: string,
  newStatus: Appointment["status"]
): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const aptRef = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId);
    await updateDoc(aptRef, { status: newStatus });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar status do agendamento no Firestore:", error);
    return false;
  }
}

export function subscribeToAppointments(
  onData: (appointments: Appointment[]) => void
): Unsubscribe | null {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const q = query(collection(db, COLLECTIONS.APPOINTMENTS));
    return onSnapshot(
      q,
      (snapshot) => {
        const appointments = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Appointment[];
        onData(appointments);
      },
      (error) => {
        console.warn(
          "[Firebase Firestore] Listener de agendamentos pausado:",
          error.message
        );
      }
    );
  } catch (error) {
    console.warn("Erro ao assinar agendamentos do Firestore:", error);
    return null;
  }
}

export async function deleteAppointmentFromFirestore(appointmentId: string): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const aptRef = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId);
    await deleteDoc(aptRef);
    return true;
  } catch (error) {
    console.error("Erro ao deletar agendamento do Firestore:", error);
    return false;
  }
}

// ==========================================
// 3. SEED / CARGA INICIAL PARA FIREBASE
// ==========================================

export async function seedInitialDataToFirestore(
  initialPatients: PatientRecord[],
  initialAppointments: Appointment[]
): Promise<{ success: boolean; message: string }> {
  if (!isFirebaseConfigured || !db) {
    return {
      success: false,
      message: "Firebase não está configurado ainda. Preencha as credenciais no .env.local",
    };
  }

  try {
    for (const pat of initialPatients) {
      await savePatientToFirestore(pat);
    }
    for (const apt of initialAppointments) {
      await saveAppointmentToFirestore(apt);
    }
    return {
      success: true,
      message: "Dados iniciais sincronizados com o Firestore com sucesso!",
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Erro na sincronização: ${error?.message || error}`,
    };
  }
}
