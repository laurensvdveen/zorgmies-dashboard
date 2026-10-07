import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZorgMies Dashboard",
  description: "Operations dashboard voor ZorgMies thuiszorg",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
