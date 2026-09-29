import "~/app/globals.css";
import type { Metadata } from "next";
import { ThemeProviderClient } from "~/components/providers/theme-provider-client";
import { PROJECT_TITLE, PROJECT_DESCRIPTION } from "~/lib/constants";
import { Providers } from "~/app/providers";
import { Toaster } from "sonner";

const appUrl =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  title: PROJECT_TITLE,
  description: PROJECT_DESCRIPTION,
  metadataBase: new URL(appUrl),
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: PROJECT_TITLE,
    description: PROJECT_DESCRIPTION,
    images: [{ url: "/logo.png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-black text-white antialiased">
        <ThemeProviderClient>
          <Providers>{children}</Providers>
          <Toaster richColors position="top-center" theme="dark" />
        </ThemeProviderClient>
      </body>
    </html>
  );
}
