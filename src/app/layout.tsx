import type { Metadata } from "next";
import "./globals.css";
import { getCandidateConfig } from "@/lib/data";
import { ToastProvider } from "@/components/toast/ToastProvider";

export function generateMetadata(): Metadata {
  const candidate = getCandidateConfig();
  return {
    title: `${candidate.nomeCurto} — Mapa de Votação ${candidate.cargo2024} 2024`,
    description: `Dashboard interno de votação ${candidate.cargo2024} 2024 em ${candidate.cidade}/${candidate.estado}, uso da equipe de campanha.`,
    robots: { index: false, follow: false },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
