import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");
  const origin = host ? `${protocol}://${host}` : "https://vault.co.tz";
  const description =
    "Cinematic photography, documentary, events and motion from Dar es Salaam, Tanzania.";

  return {
    metadataBase: new URL(origin),
    title: {
      default: "Vault — Photography & Film Studio",
      template: "%s — Vault",
    },
    description,
    alternates: {
      canonical: "/",
      languages: { en: "/", sw: "/sw" },
    },
    icons: {
      icon: "/vault-mark.png",
      shortcut: "/vault-mark.png",
    },
    openGraph: {
      title: "Vault — We Build Memory.",
      description,
      type: "website",
      images: [
        {
          url: `${origin}/vault-og.jpg`,
          width: 1776,
          height: 887,
          alt: "Vault — We Build Memory.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Vault — We Build Memory.",
      description,
      images: [`${origin}/vault-og.jpg`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
