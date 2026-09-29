import { useState, useEffect } from "react";

/**
 * Hook para detectar e reagir em tempo real à preferência de redução de movimento do sistema operacional
 * (WCAG 2.3.3 / Diretrizes Apple de Acessibilidade Vestibular).
 */
export function useReducedMotion(): boolean {
  const query = "(prefers-reduced-motion: reduce)";
  const get = () =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(query).matches
      : false;
  const [reduced, setReduced] = useState(get);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    onChange(); // sincroniza após hidratação
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
