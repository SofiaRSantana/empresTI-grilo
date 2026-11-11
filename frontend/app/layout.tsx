import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { TrpcProvider } from "@/src/client/trpc";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EmpresTI | Login",
  description: "Acesso ao sistema de empréstimo de equipamentos internos da EmpresTI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${openSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#05070F] text-[#E6EAF6]">
        <TrpcProvider>{children}</TrpcProvider>
      </body>
    </html>
  );
}
