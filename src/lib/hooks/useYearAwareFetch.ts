"use client";

import { useEffect, useRef } from "react";
import { useAcademicYears } from "@/contexts/AcademicYearContext";

export function useYearAwareFetch(fetchFn: () => void, deps: unknown[] = []) {
  const { yearVersion } = useAcademicYears();
  const initialRef = useRef(true);

  useEffect(() => {
    fetchFn();
  }, [yearVersion, ...deps]);
}
