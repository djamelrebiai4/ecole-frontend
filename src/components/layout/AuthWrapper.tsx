"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { useParams } from "next/navigation";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const isRTL = params?.locale === "ar";

  return (
    <AuthProvider>
      {children}
      <Toaster
        richColors
        position={isRTL ? "top-left" : "top-right"}
        closeButton
        dir={isRTL ? "rtl" : "ltr"}
        toastOptions={{
          duration: 4000,
        }}
      />
    </AuthProvider>
  );
}
