import type { Metadata } from "next";
import Link from "next/link";
import { entries } from "./entries";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Content | Conner Beckwith",
  description: "Content from Conner Beckwith.",
};

export default function ContentPage() {
  return (
    <div className={styles.page}>
      <main className={styles.content}>
        <nav aria-label="Main navigation">
          <Link href="/">Home</Link>
        </nav>
        <h1 id="content-title">Content</h1>
        {entries.length > 0 ? (
          <ul className={styles.entries}>
            {entries.map((entry) => (
              <li key={entry.href}>
                <h2><Link href={entry.href}>{entry.title}</Link></h2>
                <p>{entry.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nothing published yet.</p>
        )}
      </main>
    </div>
  );
}
