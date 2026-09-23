import type { Metadata } from "next";
import Link from "next/link";
import styles from "../content/page.module.css";

export const metadata: Metadata = {
  title: "The Arena | Conner Beckwith",
  description: "The Arena. Coming soon.",
};

export default function ArenaPage() {
  return (
    <div className={styles.page}>
      <main className={styles.content}>
        <nav aria-label="Main navigation">
          <Link href="/">Home</Link>
        </nav>
        <h1>The Arena</h1>
        <p>Coming soon.</p>
      </main>
    </div>
  );
}
