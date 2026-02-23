import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BoomNut - Ace Your Exams with AI",
  description: "Smart AI study buddy with flashcards, quizzes, and personalized tutoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SubscriptionProvider>
          <Navbar />
          {children}
        </SubscriptionProvider>
      </body>
    </html>
  );
}
