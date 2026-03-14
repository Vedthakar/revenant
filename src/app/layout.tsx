import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Revenant — AI Developer Clone",
  description: "Your 5th teammate. Powered by NanoClaw, Moorcheh, and Tavus.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
