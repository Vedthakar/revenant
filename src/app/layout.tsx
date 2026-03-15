import type { Metadata, Viewport } from "next";
import { GeistMono, GeistSans } from "geist/font";
import { GeistPixelGrid } from "geist/font/pixel";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Using Geist (local, no network required) as the monospace and sans-serif bases.
// CSS variables --font-jetbrains, --font-space-grotesk, and --font-ibm-plex-mono
// are aliased to Geist equivalents so downstream components continue to work.
const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "Revenant - Engineering Memory That Outlives Its Engineers",
  description:
    "Revenant captures engineering judgment, builds living company memory, and preserves founder knowledge as an interactive AI mentor your team can actually talk to.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${GeistPixelGrid.variable}`}
      style={
        {
          "--font-jetbrains": "var(--font-geist-mono)",
          "--font-space-grotesk": "var(--font-geist-sans)",
          "--font-ibm-plex-mono": "var(--font-geist-mono)",
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
