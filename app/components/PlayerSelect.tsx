"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { posthogAppLogger } from "../posthog-logger";
import { isPostHogEnabled } from "../posthog-provider";
import styles from "../player-select.module.css";
import ArcadeText from "./ArcadeText";

type Destination = {
  href: string;
  name: string;
  detail: string;
  code: string;
  portrait: {
    src: string;
    position: string;
    size: string;
  };
  fighter?: {
    src: string;
    position: string;
    size: string;
  };
};

const destinations: Destination[] = [
  {
    href: "/content",
    name: "Content",
    detail: "/content",
    code: "01",
    portrait: { src: "/content-archive.png", position: "center", size: "100% 100%" },
  },
  {
    href: "/arena",
    name: "The Arena",
    detail: "/arena",
    code: "02",
    portrait: { src: "/arena-colosseum.png", position: "center", size: "100% 100%" },
  },
  {
    href: "/ascii-maze",
    name: "ASCII Maze",
    detail: "terminal mode",
    code: "03",
    portrait: { src: "/ascii-maze-terminal.png", position: "center", size: "100% 100%" },
  },
  {
    href: "https://onlygrond.com/",
    name: "Grond",
    detail: "onlygrond.com",
    code: "04",
    portrait: { src: "/player-select-external-roster.png", position: "0% center", size: "200% 100%" },
    fighter: { src: "/player-select-external-fighters.png", position: "0% center", size: "200% 100%" },
  },
  {
    href: "https://imperialmaps.com/",
    name: "Imperial Maps",
    detail: "imperialmaps.com",
    code: "05",
    portrait: { src: "/player-select-external-roster.png", position: "100% center", size: "200% 100%" },
    fighter: { src: "/player-select-external-fighters.png", position: "100% center", size: "200% 100%" },
  },
];

const lockedSlots = ["locked-1", "locked-2"];

function StoneFrame() {
  const outline = "M 2,2 H 998 V 580 H 812 V 998 H 188 V 580 H 2 Z";
  return (
    <svg className={styles.frame} viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
      <path d={outline} fill="none" stroke="#262626" strokeWidth="6" />
      <path d="M 10,10 H 990 V 570 H 804 V 990 H 196 V 570 H 10 Z" fill="none" stroke="#999" strokeWidth="9" />
      <path d="M 19,21 H 979 V 558 H 793 V 978 H 207 V 558 H 19 Z" fill="none" stroke="#414141" strokeWidth="12" />
      <path d="M 28,32 H 970 V 546 H 784 V 966 H 216 V 546 H 28 Z" fill="none" stroke="#252525" strokeWidth="5" />
      <path d="M 35,39 H 963 V 537 H 776 V 957 H 224 V 537 H 35 Z" fill="none" stroke="#a0a09a" strokeWidth="5" />
    </svg>
  );
}

export type Emblem = {
  src: string;
  position: string;
  size: string;
};

export type NameStyle = "arcade" | "serif" | "mono" | "sans";

type PlayerSelectProps = {
  emblem?: Emblem;
  contentPortrait?: Emblem;
  mazePortrait?: Emblem;
  nameStyle?: NameStyle;
};

export default function PlayerSelect({ emblem, contentPortrait, mazePortrait, nameStyle = "arcade" }: PlayerSelectProps) {
  const [selectedIndex, setSelectedIndex] = useState(mazePortrait ? 2 : 0);
  const router = useRouter();
  const selected = destinations[selectedIndex];
  const selectedName = selected.name;

  const navigate = useCallback((destination: Destination) => {
    const destinationType = destination.href.startsWith("http") ? "external" : "internal";

    if (isPostHogEnabled) {
      posthog.capture(
        "destination_opened",
        {
          destination_code: destination.code,
          destination_type: destinationType,
        },
        // External destinations navigate away immediately, so send now via beacon instead of batching.
        { send_instantly: true, transport: "sendBeacon" },
      );
    }
    posthogAppLogger.destinationOpened(destinationType);

    if (destination.href.startsWith("http")) {
      window.location.assign(destination.href);
      return;
    }

    router.push(destination.href);
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && event.target !== document.body && !event.target.closest("[data-player-select]")) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSelectedIndex((index) => (index + destinations.length - 1) % destinations.length);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setSelectedIndex((index) => (index + 1) % destinations.length);
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((index) => index === 4 ? 1 : 4);
      }

      if (event.key === "Enter" && !(event.target instanceof HTMLAnchorElement)) {
        event.preventDefault();
        navigate(destinations[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, selectedIndex]);

  return (
    <main className={styles.screen} data-player-select>
      <section className={styles.stage} aria-labelledby="player-select-title">
        <div className={styles.pillarLeft} aria-hidden="true" />
        <div className={styles.pillarRight} aria-hidden="true" />
        <h1 id="player-select-title" className={styles.title}>
          <span className="sr-only">Choose your fighter</span>
          <ArcadeText text="CHOOSE YOUR FIGHTER" />
        </h1>

        <StoneFrame />
        <div className={styles.roster} role="group" aria-label="Destinations">
          {destinations.map((destination, index) => {
            const portrait = (index === 0 ? contentPortrait : index === 2 ? mazePortrait : undefined) ?? destination.portrait;
            return (
            <button
              key={destination.href}
              type="button"
              className={`${styles.portrait} ${styles[`slot${index}`]} ${index === selectedIndex ? styles.selected : ""}`}
              aria-label={destination.name}
              aria-pressed={index === selectedIndex}
              title={destination.detail}
              onPointerEnter={(event) => { if (event.pointerType === "mouse") setSelectedIndex(index); }}
              onFocus={() => setSelectedIndex(index)}
              onClick={() => {
                setSelectedIndex(index);
                navigate(destination);
              }}
            >
              <span
                className={styles.portraitArt}
                style={{
                  backgroundImage: `url(${portrait.src})`,
                  backgroundPosition: portrait.position,
                  backgroundSize: portrait.size,
                }}
                aria-hidden="true"
              />
              {index === selectedIndex && <span className={styles.playerMarker} aria-hidden="true">1</span>}
            </button>
            );
          })}
          <div
            className={styles.emblem}
            style={emblem ? {
              backgroundImage: `url(${emblem.src})`,
              backgroundPosition: emblem.position,
              backgroundSize: emblem.size,
            } : undefined}
            aria-hidden="true"
          />
          {lockedSlots.map((slot, index) => (
            <div key={slot} className={`${styles.portrait} ${styles.locked} ${styles[`locked${index}`]}`} aria-label="Unrevealed destination">
              <span aria-hidden="true">?</span>
            </div>
          ))}
        </div>

        {selected.fighter && <div
          className={styles.fighter}
          style={{
            backgroundImage: `url(${selected.fighter.src})`,
            backgroundPosition: selected.fighter.position,
            backgroundSize: selected.fighter.size,
          }}
          aria-hidden="true"
        />}
      </section>

      <div className={styles.selection}>
        <div className={styles.destination} aria-live="polite" aria-atomic="true">
          <p className={`${styles.name} ${styles[nameStyle]}`}>
            {nameStyle === "arcade" ? <>
              <span className="sr-only">{selectedName}</span>
              <ArcadeText text={selectedName} />
            </> : selectedName}
          </p>
          <p className={styles.domain}>{selected.detail}</p>
        </div>
      </div>
    </main>
  );
}
