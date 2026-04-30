import type { Metadata } from "next";
import { Playfair_Display, Inter, Aboreto } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const aboreto = Aboreto({
  variable: "--font-aboreto",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Nesos",
  description: "A planner for ADHD minds",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${aboreto.variable} h-full`}>
      <body className="min-h-full">
        <div className="w-full py-1.5 px-4 text-center text-[11px] tracking-wide bg-white border-b border-paper-line/30" style={{ fontFamily: "var(--font-body)", color: "var(--color-paper-rust)" }}>
          This resource is still in beta, please email{" "}
          <a href="mailto:nesosplanner@gmail.com" className="underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity">
            nesosplanner@gmail.com
          </a>
          {" "}to submit feedback
        </div>
        {children}
      </body>
    </html>
  );
}
