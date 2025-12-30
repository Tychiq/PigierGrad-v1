import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Code2 } from "lucide-react";

export const metadata: Metadata = {
  title: "PigierGrad - Gestion des Soutenances",
  description: "Plateforme de gestion des soutenances pour Pigier",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Script
            id="orchids-browser-logs"
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
            strategy="afterInteractive"
            data-orchids-project-id="0ac703ef-b515-4b3b-b8cb-a3cb722b6fa9"
          />
          <ErrorReporter />
          <Script
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
            strategy="afterInteractive"
            data-target-origin="*"
            data-message-type="ROUTE_CHANGE"
            data-include-search-params="true"
            data-only-in-iframe="true"
            data-debug="true"
            data-custom-data='{"appName": "PigierGrad", "version": "1.0.0"}'
          />
            {children}
            <footer className="fixed bottom-4 w-full flex justify-center items-center pointer-events-none z-50">
              <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-900 shadow-sm flex items-center gap-2 pointer-events-auto">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-blue-900/40 dark:text-white/40">Made with</span>
                <Code2 className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-tighter text-blue-900/40 dark:text-white/40">By Tychique</span>
              </div>
            </footer>
            <Toaster position="top-right" richColors />
          <VisualEditsMessenger />
        </ThemeProvider>
      </body>
    </html>
  );
}
