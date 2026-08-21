import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { alternatesFor } from "@/lib/seo/alternates";

type Props = Readonly<{
  params: Promise<{ locale: string }>;
}>;

/**
 * The `"use client"` this file used to carry was redundant — `LandingPage`
 * declares it already — and it blocked the metadata export, which a client
 * component cannot have.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return { alternates: alternatesFor(locale, "/") };
}

export default function HomePage() {
  return <LandingPage />;
}
