import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mascot Kombat: Mariner Moose vs. Oregon Duck",
  description: "A best-of-three arcade fight between the Mariner Moose and the Oregon Duck.",
};

export default function MascotKombatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
