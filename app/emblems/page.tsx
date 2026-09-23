"use client";

import { useState } from "react";
import Link from "next/link";
import PlayerSelect from "../components/PlayerSelect";
import styles from "./page.module.css";

const concepts = [
  { name: "CB Sigil", position: "0% 0%" },
  { name: "Dragon B", position: "100% 0%" },
  { name: "Cartographer", position: "0% 100%" },
  { name: "The Tower", position: "100% 100%" },
];

export default function EmblemPreview() {
  const [selected, setSelected] = useState(1);

  return (
    <div className={styles.lab}>
      <header className={styles.toolbar}>
        <div className={styles.heading}>
          <h1>Emblem Studies</h1>
          <Link href="/">Homepage</Link>
        </div>
        <div className={styles.options} role="group" aria-label="Center emblem">
          {concepts.map((concept, index) => (
            <button
              key={concept.name}
              type="button"
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={styles.option}
            >
              <span
                className={styles.thumbnail}
                style={{ backgroundPosition: concept.position }}
                aria-hidden="true"
              />
              <span>{concept.name}</span>
            </button>
          ))}
        </div>
      </header>
      <PlayerSelect emblem={{ src: "/personal-emblems.png", position: concepts[selected].position, size: "200% 200%" }} />
    </div>
  );
}
