"use client";

import { AcademicYearProvider } from "@/contexts/AcademicYearContext";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  return <AcademicYearProvider>{children}</AcademicYearProvider>;
}