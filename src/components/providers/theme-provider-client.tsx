'use client'

import { ThemeProvider } from "~/components/providers/theme-provider";

export function ThemeProviderClient({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
