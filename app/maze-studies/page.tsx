"use client";

import { useState } from "react";
import Link from "next/link";
import PlayerSelect from "../components/PlayerSelect";
import styles from "./page.module.css";

const directions = [
  { id: "light-grid-green", name: "The Light Grid" },
  { id: "terminal", name: "The Terminal" },
  { id: "labyrinth", name: "The Labyrinth" },
];

export default function MazeStudies() {
  const [direction, setDirection] = useState("terminal");

  return (
    <div className={styles.lab}>
      <header className={styles.toolbar}>
        <div className={styles.heading}>
          <h1>ASCII Maze studies</h1>
          <Link href="/">Homepage</Link>
        </div>
        <div className={styles.options} role="group" aria-label="Maze artwork">
          {directions.map((item) => (
            <button key={item.id} type="button" aria-pressed={direction === item.id} onClick={() => setDirection(item.id)}>
              <span className={styles.thumbnail} style={{ backgroundImage: `url('/ascii-maze-${item.id}.png')` }} aria-hidden="true" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </header>
      <PlayerSelect key={direction} mazePortrait={{ src: `/ascii-maze-${direction}.png`, position: "center", size: "100% 100%" }} />
    </div>
  );
}
