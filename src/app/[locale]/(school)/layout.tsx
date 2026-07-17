"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/Header";
import { SchoolSidebar } from "@/components/layout/SchoolSidebar";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { PageTitleProvider, usePageTitle } from "@/lib/page-title";
import { AcademicYearProvider, useAcademicYears } from "@/contexts/AcademicYearContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ChatSidebar } from "@/components/chat/ChatSidebar";

function SchoolLayoutInner({ children }: { children: React.ReactNode }) {
  const t = useTranslations("school.nav");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { title } = usePageTitle();
  const { selectedYearId } = useAcademicYears();

  return (
    <div className="flex min-h-screen bg-bg">
      <SchoolSidebar mobileOpen={mobileOpen} onMenuClick={() => setMobileOpen(!mobileOpen)} />

      <div className="flex-1 transition-all md:ms-[260px]">
        <Header
          pageTitle={title || t("dashboard")}
          onMenuClick={() => setMobileOpen(!mobileOpen)}
          showMenuButton
        />
        <main key={selectedYearId || "no-year"} className="min-w-0 p-6">{children}</main>
      </div>

      <ChatSidebar />
    </div>
  );
}

export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AcademicYearProvider>
        <PageTitleProvider>
          <ChatProvider>
            <SchoolLayoutInner>{children}</SchoolLayoutInner>
          </ChatProvider>
        </PageTitleProvider>
      </AcademicYearProvider>
    </AuthGuard>
  );
}
