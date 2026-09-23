"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import backgroundImage from "../components/background.jpeg";

const links = [
  { href: "/", label: "Home" },
  { href: "/mortal-kombat", label: "Mortal Kombat" },
  { href: "/ascii-maze", label: "ASCII Maze" },
];

type PreviewProps = {
  number: string;
  name: string;
  children: React.ReactNode;
};

function Preview({ number, name, children }: PreviewProps) {
  return (
    <article className="overflow-hidden border border-black/20 bg-[#f7f5ef] shadow-[4px_4px_0_#151515]">
      <div className="flex items-center justify-between border-b border-black/15 px-3 py-2 text-xs text-black/55">
        <span>{number}</span>
        <span>{name}</span>
      </div>
      <div className="min-h-48 p-4 sm:p-5">{children}</div>
    </article>
  );
}

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

function EdgeReveal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className="relative min-h-36 overflow-hidden bg-[#101b19] text-[#eff6e6]"
      aria-label="Edge reveal navigation"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={`absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 border border-[#eff6e6] px-3 py-2 text-sm transition ${focus}`}
      >
        CB
      </button>
      <div aria-hidden={!isOpen} className={`absolute inset-0 transition-opacity duration-200 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <Link href="/" tabIndex={isOpen ? 0 : -1} className={`absolute left-4 top-4 text-sm hover:text-[#f3d34a] ${focus}`}>HOME</Link>
        <Link href="/mortal-kombat" tabIndex={isOpen ? 0 : -1} className={`absolute right-4 top-4 text-sm hover:text-[#f3d34a] ${focus}`}>MORTAL<br />KOMBAT</Link>
        <Link href="/ascii-maze" tabIndex={isOpen ? 0 : -1} className={`absolute bottom-4 left-1/2 -translate-x-1/2 text-sm hover:text-[#f3d34a] ${focus}`}>ASCII MAZE</Link>
      </div>
      <span className="absolute bottom-3 left-4 text-xs text-[#eff6e6]/50">MOVE TOWARD THE EDGE</span>
    </nav>
  );
}

function Switcher() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="relative min-h-36 bg-[#f5f0e4]" aria-label="Single control navigation">
      <button
        type="button"
        aria-label="Open navigation"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={`absolute left-4 top-4 grid size-10 place-items-center border-2 border-[#171717] bg-[#171717] text-sm font-bold text-[#f5f0e4] transition hover:bg-[#f5f0e4] hover:text-[#171717] ${focus}`}
      >
        CB
      </button>
      <p className="absolute bottom-4 right-4 text-xs text-black/45">ONE CONTROL. EVERYWHERE.</p>
      {isOpen && (
        <div className="absolute inset-0 z-10 grid grid-cols-3 border-2 border-[#171717] bg-[#ff5533]">
          {links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col justify-between border-r-2 border-[#171717] p-3 text-black transition hover:bg-[#171717] hover:text-[#f6efe0] ${focus} ${index === 2 ? "border-r-0" : ""}`}
            >
              <span className="text-xs">0{index + 1}</span>
              <span className="text-sm font-semibold leading-tight">{link.label}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

function Ticker() {
  const [isPaused, setIsPaused] = useState(false);
  const tickerLinks = [...links, ...links];

  return (
    <nav className="relative overflow-hidden border-y-2 border-[#151515] bg-[#f5dd3e] py-3" aria-label="Ticker navigation">
      <div className={`ticker-track flex min-w-max items-center gap-6 whitespace-nowrap text-sm font-semibold ${isPaused ? "ticker-track-paused" : ""}`}>
        <Link href="/" className={`pl-3 ${focus}`}>CONNER BECKWITH</Link>
        <span>{"///"}</span>
        {tickerLinks.map((link, index) => (
          <Link key={`${link.href}-${index}`} href={link.href} className={`border-b-2 border-transparent hover:border-[#151515] ${focus}`}>
            {link.label.toUpperCase()}
          </Link>
        ))}
        <span>{"///"}</span>
        <span className="text-[#e55136]">CURRENTLY TRANSMITTING</span>
      </div>
      <button
        type="button"
        onClick={() => setIsPaused((paused) => !paused)}
        className={`absolute right-0 mt-1 border border-[#151515] bg-[#f5dd3e] px-1.5 py-0.5 text-[10px] font-semibold ${focus}`}
      >
        {isPaused ? "PLAY" : "PAUSE"}
      </button>
    </nav>
  );
}

export default function NavPrototypesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#d7dbd1] px-4 py-8 text-[#151515] sm:px-6 lg:px-8">
      <Image
        src={backgroundImage}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-10"
        quality={80}
      />
      <div className="absolute inset-0 bg-[#d7dbd1]/90" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-[#151515] pb-4">
          <div>
            <p className="text-sm">Conner Beckwith</p>
            <h1 className="mt-1 text-2xl font-medium sm:text-3xl">Seven ways to avoid a navbar</h1>
          </div>
          <Link href="/" className={`border-b border-black pb-0.5 text-sm hover:border-transparent ${focus}`}>
            Home
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Preview number="01" name="No Nav / Edge Reveal">
            <EdgeReveal />
          </Preview>

          <Preview number="02" name="Line Score">
            <nav className="overflow-x-auto border-2 border-[#0b3142] bg-[#f2ebe0] text-[#0b3142]" aria-label="Scoreboard navigation">
              <div className="min-w-[430px]">
                <div className="grid grid-cols-[1.3fr_repeat(3,1fr)_0.7fr] border-b border-[#0b3142] text-center text-[10px]">
                  <span className="border-r border-[#0b3142] p-1 text-left">CONNERBECKWITH.COM</span>
                  <span className="border-r border-[#0b3142] p-1">1</span>
                  <span className="border-r border-[#0b3142] p-1">2</span>
                  <span className="border-r border-[#0b3142] p-1">3</span>
                  <span className="p-1">R</span>
                </div>
                <div className="grid grid-cols-[1.3fr_repeat(3,1fr)_0.7fr] text-center text-sm">
                  <Link href="/" className={`border-r border-[#0b3142] p-2 text-left font-semibold hover:bg-[#0b3142] hover:text-[#f2ebe0] ${focus}`}>CB</Link>
                  {links.map((link, index) => (
                    <Link key={link.href} href={link.href} className={`border-r border-[#0b3142] p-2 hover:bg-[#0b3142] hover:text-[#f2ebe0] ${focus}`}>
                      <span className="block text-lg leading-none">{index + 1}</span>
                      <span className="block text-[10px]">{link.label}</span>
                    </Link>
                  ))}
                  <span className="p-2 text-lg font-bold">3</span>
                </div>
              </div>
            </nav>
          </Preview>

          <Preview number="03" name="Player Select">
            <nav className="border-4 border-[#121111] bg-[#ee5539] p-3 text-[#121111]" aria-label="Arcade player select navigation">
              <div className="mb-3 flex items-center justify-between border-b-2 border-[#121111] pb-2 text-xs font-bold">
                <Link href="/" className={focus}>PLAYER 1: CONNER</Link>
                <span>SELECT MODE</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {links.map((link, index) => (
                  <Link key={link.href} href={link.href} className={`group border-2 border-[#121111] bg-[#f6de68] p-2 text-center transition hover:-translate-y-1 hover:bg-[#121111] hover:text-[#f6de68] ${focus}`}>
                    <span className="block text-xs">{index === 0 ? "◉" : "○"}</span>
                    <span className="mt-2 block text-sm font-black leading-tight">{link.label}</span>
                  </Link>
                ))}
              </div>
            </nav>
          </Preview>

          <Preview number="04" name="Local Coordinates">
            <nav className="relative min-h-36 overflow-hidden border border-[#172a27] bg-[#c6e2da]" aria-label="Map navigation">
              <div className="absolute left-[16%] top-[18%] h-24 w-px -rotate-12 bg-[#172a27]" aria-hidden="true" />
              <div className="absolute left-[34%] top-[44%] h-px w-36 rotate-6 bg-[#172a27]" aria-hidden="true" />
              <div className="absolute right-[18%] top-[20%] h-20 w-px rotate-[24deg] bg-[#172a27]" aria-hidden="true" />
              <Link href="/" className={`absolute left-[12%] top-[20%] flex items-center gap-1 text-xs font-semibold ${focus}`}><span className="size-2 rounded-full bg-[#e95031]" /> CB / HOME</Link>
              <Link href="/mortal-kombat" className={`absolute left-[43%] top-[53%] flex items-center gap-1 text-xs font-semibold ${focus}`}><span className="size-2 rounded-full bg-[#e95031]" /> MORTAL KOMBAT</Link>
              <Link href="/ascii-maze" className={`absolute right-[8%] top-[22%] flex items-center gap-1 text-xs font-semibold ${focus}`}><span className="size-2 rounded-full bg-[#e95031]" /> ASCII MAZE</Link>
              <span className="absolute bottom-3 left-3 text-[10px]">47.6062° N, 122.3321° W</span>
            </nav>
          </Preview>

          <Preview number="05" name="Desktop Clutter">
            <nav className="relative min-h-36 overflow-hidden border-2 border-[#1f1f1f] bg-[#92a9c9]" aria-label="Desktop navigation">
              <Link href="/" className={`absolute left-4 top-4 w-16 text-center text-xs font-medium ${focus}`}>
                <span className="mx-auto mb-1 grid size-10 place-items-center border border-white bg-[#f4cf50] text-lg">⌂</span>
                Home
              </Link>
              <Link href="/mortal-kombat" className={`absolute left-[39%] top-8 w-20 text-center text-xs font-medium ${focus}`}>
                <span className="mx-auto mb-1 grid size-10 place-items-center border border-white bg-[#e95151] text-lg">✦</span>
                Mortal Kombat
              </Link>
              <Link href="/ascii-maze" className={`absolute bottom-3 right-5 w-16 text-center text-xs font-medium ${focus}`}>
                <span className="mx-auto mb-1 grid size-10 place-items-center border border-white bg-[#81d39b] text-lg">#</span>
                ASCII Maze
              </Link>
              <div className="absolute bottom-0 left-0 right-0 flex h-6 items-center gap-2 border-t border-white bg-[#e6e8e8] px-2 text-[10px] text-[#1f1f1f]">
                <span className="border border-[#1f1f1f] px-1">CB</span><span className="ml-auto">3:14 PM</span>
              </div>
            </nav>
          </Preview>

          <Preview number="06" name="Single Control">
            <Switcher />
          </Preview>

          <Preview number="07" name="Live Ticker">
            <Ticker />
          </Preview>
        </div>
      </div>
    </main>
  );
}
