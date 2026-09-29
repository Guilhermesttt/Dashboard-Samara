"use client";

import { useRouter } from "next/navigation";
import { LoginView } from "@/components/auth/login-view";

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push("/");
  };

  return <LoginView onLoginSuccess={handleLoginSuccess} />;
}
