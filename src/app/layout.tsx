import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Predictive State Updates",
  description: "AI Document Editor with predictive state updates",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
