"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const params = useParams();
  const isRTL = params.locale === "ar";
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  if (items.length === 0) return null;

  return (
    <nav
      className={cn("mb-4 flex items-center gap-1 text-sm text-muted", className)}
      aria-label="Breadcrumb"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronIcon className="h-3.5 w-3.5 text-muted/50" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-fg"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast && "font-semibold text-fg")}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
