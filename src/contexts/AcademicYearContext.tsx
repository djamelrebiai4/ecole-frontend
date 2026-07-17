"use client";

import { useEffect, useState, useContext, createContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, setAcademicYearId } from "@/lib/api/client";

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: "active" | "completed";
  completed_at?: string;
}

interface AcademicYearContextType {
  years: AcademicYear[];
  loading: boolean;
  selectedYearId: string | null;
  currentYear: AcademicYear | null;
  selectedYear: AcademicYear | null;
  yearVersion: number;
  setSelectedYear: (yearId: string) => void;
  refreshYears: () => Promise<void>;
  completeYear: (yearId: string) => Promise<void>;
  reopenYear: (yearId: string) => Promise<void>;
}

const AcademicYearContext = createContext<AcademicYearContextType | null>(null);

export function AcademicYearProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [yearVersion, setYearVersion] = useState(0);

  const refreshYears = useCallback(async () => {
    try {
      const response = await api.get<any>("school/academic-years?includeCompleted=true");
      const data = Array.isArray(response) ? response : response.data || [];
      setYears(data);
      const current = data.find((y: AcademicYear) => y.is_current);
      if (current) {
        setSelectedYearId(current.id);
        setAcademicYearId(current.id);
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
      setYears([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshYears();
  }, [refreshYears]);

  const setSelectedYear = useCallback((yearId: string) => {
    setSelectedYearId(yearId);
    setAcademicYearId(yearId);
    setYearVersion(v => v + 1);
    const y = years.find(yy => yy.id === yearId);
    if (y) {
      toast.success(`تم التبديل إلى السنة الدراسية: ${y.name}`);
    }
  }, [years]);

  const completeYear = async (yearId: string) => {
    if (!confirm("هل أنت متأكد من أنك تريد إتمام هذه السنة الدراسية؟ لا يمكن التراجع عن هذا الإجراء.")) {
      throw new Error("Operation cancelled by user");
    }

    try {
      await api.patch(`school/academic-years/${yearId}/complete`);
      setYears(prev => prev.map(y =>
        y.id === yearId ? { ...y, status: 'completed', completed_at: new Date().toISOString() } : y
      ));
      toast.success("تم إتمام السنة الدراسية بنجاح");
    } catch (error: any) {
      toast.error(error?.message || "خطأ أثناء إتمام السنة الدراسية");
      throw new Error(error?.message || "خطأ أثناء إتمام السنة الدراسية");
    }
  };

  const reopenYear = async (yearId: string) => {
    if (!confirm("هل أنت متأكد من أنك تريد إعادة فتح هذه السنة الدراسية؟")) {
      throw new Error("Operation cancelled by user");
    }

    try {
      await api.put(`school/academic-years/${yearId}`, { status: 'active', is_current: false });
      setYears(prev => prev.map(y =>
        y.id === yearId ? { ...y, status: 'active' } : y
      ));
      toast.success("تمت إعادة فتح السنة الدراسية بنجاح");
    } catch (error: any) {
      toast.error(error?.message || "خطأ أثناء إعادة فتح السنة الدراسية");
      throw new Error(error?.message || "خطأ أثناء إعادة فتح السنة الدراسية");
    }
  };

  const currentYear = years.find(y => y.is_current) || null;
  const selectedYear = years.find(y => y.id === selectedYearId) || null;

  return (
    <AcademicYearContext.Provider value={{
      years, loading, selectedYearId, currentYear, selectedYear, yearVersion,
      setSelectedYear, refreshYears, completeYear, reopenYear,
    }}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYears() {
  const context = useContext(AcademicYearContext);
  if (!context) {
    throw new Error("useAcademicYears must be used within an AcademicYearProvider");
  }
  return context;
}