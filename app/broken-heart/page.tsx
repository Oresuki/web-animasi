import type { Metadata } from "next";
import Link from "next/link";

import { RpsGame } from "@/components/rps-game";

export const metadata: Metadata = { title: "Patah Hati" };

export default function BrokenHeartPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#fbf7f1] px-4 py-12 text-center text-[#3b2a2f]">
      <h1 className="text-balance text-3xl font-semibold tracking-tight text-[#9b1b3d] sm:text-5xl">
        Patah Hati
      </h1>
      <p className="mt-3 max-w-md text-pretty text-[#6f2c42]">
        Coba ah
      </p>

      <RpsGame />

      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-full bg-white/85 px-5 font-semibold text-[#7a1a38] ring-1 ring-[#e9b6c5] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b1b3d]"
      >
        ← Kembali
      </Link>
    </main>
  );
}