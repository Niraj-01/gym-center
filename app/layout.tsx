import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { MemberAuthProvider } from "@/contexts/MemberAuthContext";
import { Toaster } from "@/components/ui/Toaster";
import { PRODUCT_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: {
    default: `${PRODUCT_NAME} - Gym Management`,
    template: `%s | ${PRODUCT_NAME}`,
  },
  description: "Gym management and membership tracking system — manage members, payments, plans, and attendance.",
  keywords: ["gym management", "membership tracking", "fitness center", "gym software", PRODUCT_NAME],
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: `${PRODUCT_NAME} - Gym Management`,
    description: "Gym management and membership tracking system — manage members, payments, plans, and attendance.",
    siteName: PRODUCT_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PRODUCT_NAME} - Gym Management`,
    description: "Gym management and membership tracking system.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Product+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          <MemberAuthProvider>
            {children}
            <Toaster />
          </MemberAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

