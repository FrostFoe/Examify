import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Examify — আপনার চূড়ান্ত পরীক্ষার প্রস্তুতি সঙ্গী",
  description:
    "Examify-এর সাথে আপনার পরীক্ষার প্রস্তুতি আরও সহজ ও কার্যকর করুন।",
  keywords:
    "examify,examify world,examify study,study platform,admission calendar,admission news 2025,admission 2025,university admission,question bank,bangladesh university,public university,private university,college admission,ভর্তি তথ্য,বিশ্ববিদ্যালয় ভর্তি,প্রশ্নব্যাংক,অ্যাডমিশন ক্যালেন্ডার,ভর্তি পরীক্ষা,মডেল টেস্ট,বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://db.mnr.world" />
        <link rel="dns-prefetch" href="https://db.mnr.world" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-screen bg-background antialiased font-hind-siliguri",
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
