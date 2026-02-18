import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Welcome to Ontyx",
  description: "Set up your business workspace",
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
