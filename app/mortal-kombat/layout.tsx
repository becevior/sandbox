import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mortal Kombat - Mariners Moose vs Oregon Duck",
  description: "An epic battle between the Mariners Moose and Oregon Duck in Mortal Kombat style",
};

export default function MortalKombatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
    </>
  );
} 