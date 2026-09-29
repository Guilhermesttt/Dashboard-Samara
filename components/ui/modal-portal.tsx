"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { acquireAppScrollLock } from "@/lib/app-scroll-lock";

interface ModalPortalProps {
  children: React.ReactNode;
  isOpen?: boolean;
}

export function ModalPortal({ children, isOpen = true }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    return acquireAppScrollLock(document);
  }, [isOpen]);

  if (!mounted || !isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}
