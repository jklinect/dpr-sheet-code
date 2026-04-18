import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DPR Calculator",
  description: "D&D 5e Damage Per Round calculator",
  icons: {
    icon: "/favicon.svg",
  },
};

// eslint-disable-next-line require-jsdoc
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-sm antialiased">
        {children}
      </body>
    </html>
  );
}
