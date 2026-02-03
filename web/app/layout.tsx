
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { GenerationProvider } from "@/context/GenerationContext"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEO Automation SaaS",
  description: "AI-Powered SEO Content Gen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GenerationProvider>
          <SidebarProvider>
            <AppSidebar />
            <main className="w-full">
              <div className="p-4 md:p-6">
                <SidebarTrigger className="mb-4 md:hidden" />
                {children}
              </div>
            </main>
          </SidebarProvider>
        </GenerationProvider>
      </body>
    </html>
  );
}
