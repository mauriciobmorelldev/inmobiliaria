import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import MotionProvider from "@/components/providers/MotionProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Connexa · Inmobiliaria",
  description: "Plataforma inmobiliaria Connexa con panel administrativo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-theme="light"
      style={{ colorScheme: "light" }}
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-background font-body selection:bg-primary-fixed selection:text-on-primary-fixed">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
