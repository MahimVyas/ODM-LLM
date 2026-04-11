// app/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPageClient from "@/components/LandingPageClient";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/chat");
  }

  return <LandingPageClient />;
}