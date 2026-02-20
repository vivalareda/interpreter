import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interpr\u00e9teur Qu\u00e9becois",
  description:
    "Un interpr\u00e9teur de langage de programmation avec syntaxe qu\u00e9b\u00e9coise",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
