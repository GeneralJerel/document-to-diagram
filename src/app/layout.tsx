import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Document to Diagram",
  description: "Document to Diagram with Open Generative UI, powered by CopilotKit",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
