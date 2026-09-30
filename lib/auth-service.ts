import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase.ts";
import { STORAGE_KEYS } from "./storage-keys.ts";

export type UserRole = "admin" | "funcionaria";

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  title?: string;
  photoUrl?: string;
  createdAt?: string;
}

// E-mails com privilégio administrativo automático na inicialização
const DEFAULT_ADMIN_EMAILS = [
  "samara-nagy@hotmail.com",
  "dra.samara@samaraestetica.com.br",
  "samara@samaraestetica.com.br",
  "samara@estetica.com",
];

export function isClinicAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    DEFAULT_ADMIN_EMAILS.includes(clean) ||
    clean.startsWith("samara-") ||
    clean.startsWith("dra.samara")
  );
}

/**
 * Busca ou provisiona o documento do usuário em `users/{uid}` no Firestore
 */
export async function getUserProfileAndRole(
  user: FirebaseUser
): Promise<AppUser> {
  const fallbackName = user.displayName || user.email?.split("@")[0] || "Usuária";
  const defaultRole: UserRole = isClinicAdminEmail(user.email) ? "admin" : "funcionaria";

  if (!isFirebaseConfigured || !db) {
    return {
      uid: user.uid,
      email: user.email || "",
      name: fallbackName,
      role: defaultRole,
    };
  }

  try {
    const userDocRef = doc(db, "users", user.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: user.uid,
        email: user.email || data.email || "",
        name: data.name || fallbackName,
        role: (data.role as UserRole) || defaultRole,
        title: data.title,
        photoUrl: data.photoUrl,
        createdAt: data.createdAt,
      };
    }

    // Se o documento ainda não existe (ex: primeiro login), provisiona no Firestore
    const newUserData: AppUser = {
      uid: user.uid,
      email: user.email || "",
      name: fallbackName,
      role: defaultRole,
      createdAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, newUserData, { merge: true });
    return newUserData;
  } catch (error) {
    console.warn("[AuthService] Aviso ao buscar perfil do usuário no Firestore:", error);
    return {
      uid: user.uid,
      email: user.email || "",
      name: fallbackName,
      role: defaultRole,
    };
  }
}

/**
 * Login com E-mail e Senha no Firebase Auth
 */
export async function loginWithFirebase(
  email: string,
  password: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  if (!isFirebaseConfigured || !auth) {
    return {
      success: false,
      error: "O serviço de autenticação do Firebase não está configurado.",
    };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password.trim()
    );

    const appUser = await getUserProfileAndRole(userCredential.user);

    // Salvar token e dados de sessão de forma segura
    try {
      localStorage.setItem("samara_auth_session", "true");
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, "true");
      localStorage.setItem("samara_user_uid", appUser.uid);
      localStorage.setItem("samara_user_email", appUser.email);
      localStorage.setItem("samara_user_role", appUser.role);
      localStorage.setItem("samara_user_name", appUser.name);
    } catch (e) {}

    return { success: true, user: appUser };
  } catch (err: any) {
    let message = "Falha ao realizar login. Verifique seu e-mail e senha.";
    switch (err.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        message = "E-mail ou senha incorretos. Por favor, tente novamente.";
        break;
      case "auth/invalid-email":
        message = "O formato do e-mail inserido é inválido.";
        break;
      case "auth/user-disabled":
        message = "Esta conta foi desativada pelo administrador.";
        break;
      case "auth/too-many-requests":
        message =
          "Muitas tentativas sem sucesso. Por favor, aguarde alguns minutos antes de tentar novamente.";
        break;
      case "auth/network-request-failed":
        message = "Erro de conexão de rede. Verifique sua conexão com a internet.";
        break;
      default:
        if (err.message) message = err.message;
    }
    return { success: false, error: message };
  }
}

/**
 * Criação de nova conta no Firebase Auth com perfil em `users/{uid}`
 */
export async function registerWithFirebase(
  name: string,
  email: string,
  password: string,
  desiredRole?: UserRole
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  if (!isFirebaseConfigured || !auth) {
    return {
      success: false,
      error: "O serviço de autenticação do Firebase não está configurado.",
    };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      cleanEmail,
      password.trim()
    );

    // Atualiza nome de exibição no Firebase Auth
    try {
      await updateProfile(userCredential.user, {
        displayName: cleanName,
      });
    } catch (e) {}

    // Define papel: e-mails oficiais da Dra. Sâmara sempre ganham admin; outras contas são "funcionaria"
    const assignedRole: UserRole = isClinicAdminEmail(cleanEmail)
      ? "admin"
      : desiredRole || "funcionaria";

    const appUser: AppUser = {
      uid: userCredential.user.uid,
      email: cleanEmail,
      name: cleanName,
      role: assignedRole,
      title: assignedRole === "admin" ? "Biomédica Esteta • Responsável Técnica" : "Equipe de Atendimento",
      createdAt: new Date().toISOString(),
    };

    // Salva documento em users/{uid}
    if (db) {
      await setDoc(doc(db, "users", appUser.uid), appUser, { merge: true });
    }

    try {
      localStorage.setItem("samara_auth_session", "true");
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, "true");
      localStorage.setItem("samara_user_uid", appUser.uid);
      localStorage.setItem("samara_user_email", appUser.email);
      localStorage.setItem("samara_user_role", appUser.role);
      localStorage.setItem("samara_user_name", appUser.name);
    } catch (e) {}

    return { success: true, user: appUser };
  } catch (err: any) {
    let message = "Não foi possível criar a conta. Tente novamente.";
    switch (err.code) {
      case "auth/email-already-in-use":
        message = "Já existe uma conta cadastrada com este endereço de e-mail.";
        break;
      case "auth/invalid-email":
        message = "O endereço de e-mail informado é inválido.";
        break;
      case "auth/weak-password":
        message = "A senha deve conter no mínimo 6 caracteres.";
        break;
      default:
        if (err.message) message = err.message;
    }
    return { success: false, error: message };
  }
}

/**
 * Logout do Firebase Auth e limpeza da sessão
 */
export async function logoutFromFirebase(): Promise<void> {
  if (auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("[AuthService] Erro ao deslogar do Firebase:", e);
    }
  }

  try {
    localStorage.removeItem("samara_auth_session");
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    localStorage.removeItem("samara_user_uid");
    localStorage.removeItem("samara_user_email");
    localStorage.removeItem("samara_user_role");
    localStorage.removeItem("samara_user_name");
    sessionStorage.removeItem("samara_last_alert_run");
  } catch (e) {}
}

/**
 * Monitora o estado de autenticação em tempo real
 */
export function subscribeToAuthState(
  onUserChange: (user: AppUser | null) => void
): () => void {
  if (!auth) {
    // Modo offline / fallback
    const saved = typeof window !== "undefined" ? localStorage.getItem("samara_auth_session") : null;
    if (saved === "true") {
      const email = localStorage.getItem("samara_user_email") || "dra.samara@samaraestetica.com.br";
      const name = localStorage.getItem("samara_user_name") || "Dra. Sâmara Souza";
      const role = (localStorage.getItem("samara_user_role") as UserRole) || "admin";
      const uid = localStorage.getItem("samara_user_uid") || "local-user";
      onUserChange({ uid, email, name, role });
    } else {
      onUserChange(null);
    }
    return () => {};
  }

  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const appUser = await getUserProfileAndRole(firebaseUser);
      onUserChange(appUser);
    } else {
      // Checa se há sessão local (útil para testes E2E mockados)
      const saved = typeof window !== "undefined" ? localStorage.getItem("samara_auth_session") : null;
      if (saved === "true") {
        const email = localStorage.getItem("samara_user_email") || "dra.samara@samaraestetica.com.br";
        const name = localStorage.getItem("samara_user_name") || "Dra. Sâmara Souza";
        const role = (localStorage.getItem("samara_user_role") as UserRole) || "admin";
        const uid = localStorage.getItem("samara_user_uid") || "local-user";
        onUserChange({ uid, email, name, role });
      } else {
        onUserChange(null);
      }
    }
  });

  return unsubscribe;
}

/**
 * Altera a senha do usuário autenticado no Firebase Auth
 */
export async function changeUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const user = auth?.currentUser;
  if (!user || !user.email) {
    return {
      success: false,
      error: "Usuário não autenticado ou sessão expirada.",
    };
  }

  try {
    const userEmail = user.email;
    // Reautentica para garantir autorização de operação sensível
    const credential = EmailAuthProvider.credential(
      userEmail,
      currentPassword.trim()
    );
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword.trim());
    return { success: true };
  } catch (err: any) {
    let message = "Não foi possível atualizar a senha.";
    switch (err.code) {
      case "auth/wrong-password":
      case "auth/invalid-credential":
        message = "A senha atual informada está incorreta.";
        break;
      case "auth/weak-password":
        message = "A nova senha deve ter pelo menos 6 caracteres.";
        break;
      case "auth/requires-recent-login":
        message = "Por segurança, faça login novamente antes de alterar sua senha.";
        break;
      default:
        if (err.message) message = err.message;
    }
    return { success: false, error: message };
  }
}

/**
 * Assina em tempo real todos os membros da equipe clínica em `users`
 */
export function subscribeToClinicTeam(
  onTeamUpdate: (members: AppUser[]) => void
): Unsubscribe | (() => void) {
  if (!isFirebaseConfigured || !db) {
    onTeamUpdate([
      {
        uid: "admin-samara",
        name: "Dra. Sâmara Souza",
        email: "dra.samara@samaraestetica.com.br",
        role: "admin",
        title: "Biomédica Esteta • Responsável Técnica",
        createdAt: new Date().toISOString(),
      },
    ]);
    return () => {};
  }

  try {
    const usersCol = collection(db, "users");
    return onSnapshot(
      usersCol,
      (snapshot) => {
        const members: AppUser[] = snapshot.docs.map((docSnap) => ({
          uid: docSnap.id,
          ...docSnap.data(),
        })) as AppUser[];
        onTeamUpdate(members);
      },
      (err) => {
        console.warn("[AuthService] Erro ao assinar equipe:", err);
      }
    );
  } catch (e) {
    console.warn("[AuthService] Erro de inicialização da equipe:", e);
    return () => {};
  }
}

/**
 * Atualiza o papel de uma colaboradora (admin <-> funcionaria)
 */
export async function updateUserRoleInFirestore(
  targetUid: string,
  newRole: UserRole
): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    await updateDoc(doc(db, "users", targetUid), {
      role: newRole,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error("Erro ao atualizar papel do usuário:", err);
    return false;
  }
}

/**
 * Remove o acesso de uma colaboradora da clínica no Firestore
 */
export async function deleteUserFromClinic(targetUid: string): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    await deleteDoc(doc(db, "users", targetUid));
    return true;
  } catch (err) {
    console.error("Erro ao remover colaboradora:", err);
    return false;
  }
}
