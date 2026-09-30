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
import {
  STORAGE_KEYS,
  setStoredJwtToken,
  getStoredJwtToken,
  findStoredAccount,
  updateStoredAccount,
  saveRegisteredUser,
  getStoredAccounts,
  type UserAccount,
} from "./storage-keys.ts";
import { hashPassword, verifyPassword, signJwt } from "./security-crypto.ts";

export type UserRole = "admin" | "funcionaria";

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  title?: string;
  photoUrl?: string;
  createdAt?: string;
  token?: string; // Token JWT criptografado da sessão
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
 * Autentica usuário via verificação em tempo constante de Hash PBKDF2 com Salt
 */
async function loginWithHashedPasswordAndJwt(
  cleanEmail: string,
  cleanPassword: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  // 1. Tentar encontrar conta no armazenamento criptográfico local
  let account = findStoredAccount(cleanEmail);

  // 2. Se não encontrou localmente, tentar buscar no Firestore se disponível
  if (!account && db) {
    try {
      const usersCol = collection(db, "users");
      const q = query(usersCol, where("email", "==", cleanEmail));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const docData = querySnap.docs[0].data();
        if (docData.passwordHash) {
          account = {
            name: docData.name || "Usuária",
            email: cleanEmail,
            passwordHash: docData.passwordHash,
            role: (docData.role as UserRole) || "funcionaria",
            createdAt: docData.createdAt || new Date().toISOString(),
          };
          await saveRegisteredUser(account);
        }
      }
    } catch (e) {
      // Ignora silenciosamente se o Firestore não permitir leitura não autenticada
    }
  }

  // 3. Primeiro login transparente para a Administradora (Dra. Sâmara)
  if (!account && isClinicAdminEmail(cleanEmail)) {
    const defaultName = cleanEmail.includes("samara-nagy") ? "Dra. Sâmara Nagy" : "Dra. Sâmara Souza";
    const hashed = await hashPassword(cleanPassword);
    account = {
      name: defaultName,
      email: cleanEmail,
      passwordHash: hashed,
      role: "admin",
      createdAt: new Date().toISOString(),
    };
    await saveRegisteredUser(account);

    if (db) {
      try {
        await setDoc(doc(db, "users", "admin-samara"), {
          uid: "admin-samara",
          email: cleanEmail,
          name: defaultName,
          role: "admin",
          passwordHash: hashed,
          title: "Biomédica Esteta • Responsável Técnica",
          createdAt: new Date().toISOString(),
        }, { merge: true });
      } catch (e) {}
    }
  }

  // 4. Se a conta não existe
  if (!account) {
    return {
      success: false,
      error: "Conta não encontrada. Se for seu primeiro acesso, cadastre-se na aba Criar Conta.",
    };
  }

  // 5. Verificação da senha usando tempo constante contra o hash PBKDF2
  const isPasswordValid = await verifyPassword(cleanPassword, account.passwordHash);
  if (!isPasswordValid) {
    return {
      success: false,
      error: "Senha incorreta. Por favor, tente novamente.",
    };
  }

  // 6. Senha validada com sucesso! Gerar dados da sessão e Token JWT
  const appUser: AppUser = {
    uid: `user-${cleanEmail.replace(/[^a-zA-Z0-9]/g, "-")}`,
    email: cleanEmail,
    name: account.name,
    role: account.role || (isClinicAdminEmail(cleanEmail) ? "admin" : "funcionaria"),
    title: account.role === "admin" || isClinicAdminEmail(cleanEmail)
      ? "Biomédica Esteta • Responsável Técnica"
      : "Equipe de Atendimento",
    createdAt: account.createdAt,
  };

  try {
    const jwtToken = await signJwt({
      sub: appUser.uid,
      email: appUser.email,
      role: appUser.role,
      name: appUser.name,
    });
    appUser.token = jwtToken;
    setStoredJwtToken(jwtToken);
  } catch (e) {
    console.warn("Aviso ao emitir JWT:", e);
  }

  try {
    localStorage.setItem("samara_auth_session", "true");
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, "true");
    localStorage.setItem("samara_user_uid", appUser.uid);
    localStorage.setItem("samara_user_email", appUser.email);
    localStorage.setItem("samara_user_role", appUser.role);
    localStorage.setItem("samara_user_name", appUser.name);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("samara_auth_state_changed"));
    }
  } catch (e) {}

  return { success: true, user: appUser };
}

/**
 * Criação nativa de conta com hash PBKDF2 com Salt e emissão de JWT
 */
async function registerWithHashedPasswordAndJwt(
  cleanName: string,
  cleanEmail: string,
  cleanPassword: string,
  desiredRole?: UserRole
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const existing = findStoredAccount(cleanEmail);
  if (existing) {
    return {
      success: false,
      error: "Já existe uma conta cadastrada com este endereço de e-mail.",
    };
  }

  const assignedRole: UserRole = isClinicAdminEmail(cleanEmail)
    ? "admin"
    : desiredRole || "funcionaria";

  const passwordHash = await hashPassword(cleanPassword);
  const uid = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  await saveRegisteredUser({
    name: cleanName,
    email: cleanEmail,
    passwordHash,
    role: assignedRole,
  });

  const appUser: AppUser = {
    uid,
    email: cleanEmail,
    name: cleanName,
    role: assignedRole,
    title: assignedRole === "admin"
      ? "Biomédica Esteta • Responsável Técnica"
      : "Equipe de Atendimento",
    createdAt: new Date().toISOString(),
  };

  if (db) {
    try {
      await setDoc(doc(db, "users", uid), {
        ...appUser,
        passwordHash,
      }, { merge: true });
    } catch (e) {}
  }

  try {
    const jwtToken = await signJwt({
      sub: appUser.uid,
      email: appUser.email,
      role: appUser.role,
      name: appUser.name,
    });
    appUser.token = jwtToken;
    setStoredJwtToken(jwtToken);
  } catch (e) {
    console.warn("Aviso ao emitir JWT no registro:", e);
  }

  try {
    localStorage.setItem("samara_auth_session", "true");
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, "true");
    localStorage.setItem("samara_user_uid", appUser.uid);
    localStorage.setItem("samara_user_email", appUser.email);
    localStorage.setItem("samara_user_role", appUser.role);
    localStorage.setItem("samara_user_name", appUser.name);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("samara_auth_state_changed"));
    }
  } catch (e) {}

  return { success: true, user: appUser };
}

/**
 * Login com E-mail e Senha no Firebase Auth com fallback nativo JWT + Hash PBKDF2
 */
export async function loginWithFirebase(
  email: string,
  password: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) {
    return {
      success: false,
      error: "Por favor, preencha todos os campos obrigatórios.",
    };
  }

  let fallbackRequired = false;

  if (isFirebaseConfigured && auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        cleanPassword
      );

      const appUser = await getUserProfileAndRole(userCredential.user);

      // Gerar token JWT assinado para a sessão
      try {
        const jwtToken = await signJwt({
          sub: appUser.uid,
          email: appUser.email,
          role: appUser.role,
          name: appUser.name,
        });
        appUser.token = jwtToken;
        setStoredJwtToken(jwtToken);
      } catch (e) {
        console.warn("Aviso ao emitir JWT:", e);
      }

      // Salvar dados de sessão
      try {
        localStorage.setItem("samara_auth_session", "true");
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, "true");
        localStorage.setItem("samara_user_uid", appUser.uid);
        localStorage.setItem("samara_user_email", appUser.email);
        localStorage.setItem("samara_user_role", appUser.role);
        localStorage.setItem("samara_user_name", appUser.name);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("samara_auth_state_changed"));
        }
      } catch (e) {}

      return { success: true, user: appUser };
    } catch (err: any) {
      // Se o Firebase indicar que o provedor Email/Password não está habilitado no Console
      // ou falhar a conexão com a rede, aciona o fallback nativo com Hash PBKDF2 + JWT
      if (
        err.code === "auth/configuration-not-found" ||
        err.code === "auth/network-request-failed" ||
        String(err.message || "").includes("configuration-not-found")
      ) {
        fallbackRequired = true;
      } else {
        let message = "Falha ao realizar login. Verifique seu e-mail e senha.";
        switch (err.code) {
          case "auth/wrong-password":
            message = "Senha incorreta. Por favor, tente novamente.";
            break;
          case "auth/user-not-found":
            message = "Conta não encontrada. Se for seu primeiro acesso, cadastre-se na aba Criar Conta.";
            break;
          case "auth/invalid-credential": {
            const localAcc = findStoredAccount(cleanEmail);
            if (localAcc) {
              message = "Senha incorreta. Por favor, tente novamente.";
            } else {
              message = "Senha incorreta ou e-mail não encontrado. Por favor, tente novamente.";
            }
            break;
          }
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
          default:
            if (err.message && !err.message.includes("configuration-not-found")) {
              message = err.message;
            }
        }
        return { success: false, error: message };
      }
    }
  } else {
    fallbackRequired = true;
  }

  if (fallbackRequired) {
    return loginWithHashedPasswordAndJwt(cleanEmail, cleanPassword);
  }

  return { success: false, error: "Falha inesperada no fluxo de login." };
}

/**
 * Criação de nova conta no Firebase Auth com fallback nativo JWT + Hash PBKDF2
 */
export async function registerWithFirebase(
  name: string,
  email: string,
  password: string,
  desiredRole?: UserRole
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const cleanPassword = password.trim();

  let fallbackRequired = false;

  if (isFirebaseConfigured && auth) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        cleanPassword
      );

      try {
        await updateProfile(userCredential.user, {
          displayName: cleanName,
        });
      } catch (e) {}

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

      // Gera hash PBKDF2 para sincronizar
      try {
        const passwordHash = await hashPassword(cleanPassword);
        await saveRegisteredUser({
          name: cleanName,
          email: cleanEmail,
          passwordHash,
          role: assignedRole,
        });

        if (db) {
          await setDoc(doc(db, "users", appUser.uid), {
            ...appUser,
            passwordHash,
          }, { merge: true });
        }
      } catch (e) {}

      try {
        const jwtToken = await signJwt({
          sub: appUser.uid,
          email: appUser.email,
          role: appUser.role,
          name: appUser.name,
        });
        appUser.token = jwtToken;
        setStoredJwtToken(jwtToken);
      } catch (e) {
        console.warn("Aviso ao emitir JWT no cadastro:", e);
      }

      try {
        localStorage.setItem("samara_auth_session", "true");
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, "true");
        localStorage.setItem("samara_user_uid", appUser.uid);
        localStorage.setItem("samara_user_email", appUser.email);
        localStorage.setItem("samara_user_role", appUser.role);
        localStorage.setItem("samara_user_name", appUser.name);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("samara_auth_state_changed"));
        }
      } catch (e) {}

      return { success: true, user: appUser };
    } catch (err: any) {
      if (
        err.code === "auth/configuration-not-found" ||
        err.code === "auth/network-request-failed" ||
        String(err.message || "").includes("configuration-not-found")
      ) {
        fallbackRequired = true;
      } else {
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
            if (err.message && !err.message.includes("configuration-not-found")) {
              message = err.message;
            }
        }
        return { success: false, error: message };
      }
    }
  } else {
    fallbackRequired = true;
  }

  if (fallbackRequired) {
    return registerWithHashedPasswordAndJwt(cleanName, cleanEmail, cleanPassword, desiredRole);
  }

  return { success: false, error: "Erro desconhecido ao registrar usuário." };
}

/**
 * Logout do Firebase Auth e limpeza da sessão JWT
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
    setStoredJwtToken(null);
    localStorage.removeItem("samara_auth_session");
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    localStorage.removeItem("samara_user_uid");
    localStorage.removeItem("samara_user_email");
    localStorage.removeItem("samara_user_role");
    localStorage.removeItem("samara_user_name");
    sessionStorage.removeItem("samara_last_alert_run");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("samara_auth_state_changed"));
    }
  } catch (e) {}
}

/**
 * Monitora o estado de autenticação em tempo real (Firebase Auth + JWT Nativo)
 */
export function subscribeToAuthState(
  onUserChange: (user: AppUser | null) => void
): () => void {
  const emitLocalSession = () => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("samara_auth_session") : null;
    if (saved === "true") {
      const email = localStorage.getItem("samara_user_email") || "dra.samara@samaraestetica.com.br";
      const name = localStorage.getItem("samara_user_name") || "Dra. Sâmara Souza";
      const role = (localStorage.getItem("samara_user_role") as UserRole) || "admin";
      const uid = localStorage.getItem("samara_user_uid") || "local-user";
      const token = getStoredJwtToken() || undefined;
      onUserChange({ uid, email, name, role, token });
    } else {
      setStoredJwtToken(null);
      onUserChange(null);
    }
  };

  if (!auth) {
    emitLocalSession();
    if (typeof window !== "undefined") {
      window.addEventListener("samara_auth_state_changed", emitLocalSession);
      window.addEventListener("storage", emitLocalSession);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("samara_auth_state_changed", emitLocalSession);
        window.removeEventListener("storage", emitLocalSession);
      }
    };
  }

  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const appUser = await getUserProfileAndRole(firebaseUser);
      let token = getStoredJwtToken();
      if (!token) {
        try {
          token = await signJwt({
            sub: appUser.uid,
            email: appUser.email,
            role: appUser.role,
            name: appUser.name,
          });
          setStoredJwtToken(token);
        } catch (e) {}
      }
      appUser.token = token || undefined;
      onUserChange(appUser);
    } else {
      emitLocalSession();
    }
  });

  const handleStateEvent = () => {
    if (!auth?.currentUser) {
      emitLocalSession();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("samara_auth_state_changed", handleStateEvent);
    window.addEventListener("storage", handleStateEvent);
  }

  return () => {
    unsubscribe();
    if (typeof window !== "undefined") {
      window.removeEventListener("samara_auth_state_changed", handleStateEvent);
      window.removeEventListener("storage", handleStateEvent);
    }
  };
}

/**
 * Retorna o token JWT ativo atual
 */
export function getAuthJwtToken(): string | null {
  return getStoredJwtToken();
}

/**
 * Altera a senha do usuário com persistência criptográfica PBKDF2 e suporte a Firebase Auth
 */
export async function changeUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const cleanCurrent = currentPassword.trim();
  const cleanNew = newPassword.trim();

  if (cleanNew.length < 6) {
    return {
      success: false,
      error: "A nova senha deve ter pelo menos 6 caracteres.",
    };
  }

  const user = auth?.currentUser;

  // Se o Firebase Auth estiver autenticado na nuvem:
  if (user && user.email) {
    try {
      const credential = EmailAuthProvider.credential(user.email, cleanCurrent);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, cleanNew);

      // Sincroniza hash criptográfico PBKDF2
      const newHash = await hashPassword(cleanNew);
      updateStoredAccount(user.email, { passwordHash: newHash });
      if (db) {
        try {
          await updateDoc(doc(db, "users", user.uid), { passwordHash: newHash });
        } catch (e) {}
      }
      return { success: true };
    } catch (err: any) {
      if (
        err.code !== "auth/configuration-not-found" &&
        !String(err.message || "").includes("configuration-not-found")
      ) {
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
  }

  // Fallback nativo: Alteração de senha via PBKDF2
  const sessionEmail = typeof window !== "undefined"
    ? localStorage.getItem("samara_user_email")
    : null;

  if (!sessionEmail) {
    return {
      success: false,
      error: "Usuário não autenticado ou sessão expirada.",
    };
  }

  const account = findStoredAccount(sessionEmail);
  if (!account) {
    return {
      success: false,
      error: "Conta não encontrada no armazenamento local.",
    };
  }

  const isCurrentValid = await verifyPassword(cleanCurrent, account.passwordHash);
  if (!isCurrentValid) {
    return {
      success: false,
      error: "A senha atual informada está incorreta.",
    };
  }

  const newHash = await hashPassword(cleanNew);
  updateStoredAccount(sessionEmail, { passwordHash: newHash });

  if (db) {
    try {
      const uid = localStorage.getItem("samara_user_uid") || `user-${sessionEmail}`;
      await updateDoc(doc(db, "users", uid), { passwordHash: newHash });
    } catch (e) {}
  }

  return { success: true };
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
