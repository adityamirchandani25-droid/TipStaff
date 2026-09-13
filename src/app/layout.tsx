import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { DM_Sans, Public_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavigationTransition } from "@/components/navigation-transition";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";
import "./motion.css";
import "./globals.dark.css";
import "./product-polish.css";
import "./product-polish.dark.css";
import "./theme.css";

const publicSans = Public_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "FixItFast — Local home repair, without the runaround",
    template: "%s | FixItFast",
  },
  description:
    "Find approved home-service professionals sharing live availability near you, compare starting estimates, and send a service request.",
  applicationName: "FixItFast",
  openGraph: {
    type: "website",
    siteName: "FixItFast",
    title: "FixItFast — Local home repair, without the runaround",
    description: "Find approved home-service professionals sharing live availability near you.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "FixItFast — Local home repair, without the runaround",
    description: "Find approved home-service professionals sharing live availability near you.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${publicSans.variable} ${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-surface text-ink-900 font-sans">
        <ThemeProvider>
          {children}
          <Suspense fallback={null}>
            <NavigationTransition />
          </Suspense>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
