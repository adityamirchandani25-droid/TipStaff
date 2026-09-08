import type { Metadata } from "next";
import { DM_Sans, Public_Sans } from "next/font/google";
import { AuthSessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";
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
  title: "TipStaff — On-demand home repair",
  description:
    "Choose a home service, see a starting estimate, and manage your requests with TipStaff.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-surface text-ink-900 font-sans">
        <ThemeProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
