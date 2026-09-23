"use client";

import { useState } from "react";
import Link from "next/link";
import PlayerSelect, { type NameStyle } from "../components/PlayerSelect";
import styles from "./page.module.css";

const directions = [
  { id: "codex", name: "The Codex" },
  { id: "library", name: "Grand Library" },
  { id: "scriptorium", name: "The Scriptorium" },
  { id: "archive", name: "Forbidden Archive" },
];

const fonts: { id: NameStyle; name: string }[] = [
  { id: "arcade", name: "Title lettering" },
  { id: "serif", name: "Library serif" },
  { id: "mono", name: "Terminal mono" },
  { id: "sans", name: "Clean sans" },
];

export default function ContentStudies() {
  const [direction, setDirection] = useState("archive");
  const [font, setFont] = useState<NameStyle>("arcade");

  return (
    <div className={styles.lab}>
      <header className={styles.toolbar}>
        <div className={styles.heading}>
          <h1>Content studies</h1>
          <Link href="/">Homepage</Link>
        </div>
        <div className={styles.controls}>
          <div className={styles.artOptions} role="group" aria-label="Content artwork">
            {directions.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.artOption}
                aria-pressed={direction === item.id}
                onClick={() => setDirection(item.id)}
              >
                <span className={styles.thumbnail} style={{ backgroundImage: `url('/content-${item.id}.png')` }} aria-hidden="true" />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
          <fieldset className={styles.fontOptions}>
            <legend>Selected name</legend>
            {fonts.map((item) => (
              <label key={item.id} className={styles[item.id]}>
                <input type="radio" name="name-font" value={item.id} checked={font === item.id} onChange={() => setFont(item.id)} />
                {item.name}
              </label>
            ))}
          </fieldset>
        </div>
      </header>
      <PlayerSelect
        key={direction}
        contentPortrait={{ src: `/content-${direction}.png`, position: "center", size: "100% 100%" }}
        nameStyle={font}
      />
    </div>
  );
}
