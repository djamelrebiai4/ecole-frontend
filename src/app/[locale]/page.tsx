import { setRequestLocale } from "next-intl/server";
import SlideDeck from "@/components/landing/SlideDeck";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SlideDeck />;
}
