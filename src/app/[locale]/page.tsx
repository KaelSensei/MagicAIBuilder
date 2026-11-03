import type { Metadata } from "next";
import { JsonLd, softwareApplicationJsonLd } from "@/components/JsonLd";
import { LandingPage } from "@/components/landing/LandingPage";
import {
  alternatesFor,
  isSupportedLocale,
  localePath,
  siteUrl,
} from "@/lib/seo/alternates";
import { routing } from "@/i18n/routing";

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

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const servedLocale = isSupportedLocale(locale)
    ? locale
    : routing.defaultLocale;
  const canonicalUrl = `${siteUrl()}${localePath(servedLocale, "/")}`;

  return (
    <>
      <JsonLd data={{ ...softwareApplicationJsonLd, url: canonicalUrl }} />
      <LandingPage />
    </>
  );
}
