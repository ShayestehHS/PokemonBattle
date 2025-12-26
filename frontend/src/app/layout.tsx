import type { Metadata } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import { ToastProvider } from "@/components/toast-provider";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: false,
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Pokémon Battle Arena | Trainer Login",
  description: "Enter the arena and battle with your favorite Pokémon. Login or register to start your journey!",
  keywords: ["pokemon", "battle", "arena", "trainer", "game"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${nunitoSans.variable} font-sans antialiased`}
        style={{ fontFamily: "var(--font-nunito), var(--font-nunito-sans), system-ui, sans-serif" }}
      >
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
