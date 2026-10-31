import type { Metadata } from "next";

import { BirthdateGate } from "@/components/birthdate-gate";
import { LottieChoiceCard } from "@/components/lottie-choice-card";

export const metadata: Metadata = {
  title: "Pilih Konsepmu",
  description: "Pilih salah satu: Heart atau Broken Heart.",
};

/**
 * Isi dengan link Lottie milikmu (.lottie atau .json).
 * Contoh: "https://lottie.host/xxxx/xxxx.lottie" atau "/animations/heart.lottie"
 * (file lokal diletakkan di folder `public/`).
 * Dibiarkan kosong = tampil ilustrasi cadangan.
 */
const LOTTIE_HEART = "";
const LOTTIE_BROKEN_HEART = "";

export default function HomePage() {
  return (
    <BirthdateGate>
      <main className="flex min-h-dvh items-center justify-center overflow-hidden bg-[#fbf7f1] px-4 py-12 text-[#3b2a2f] sm:px-6">
        <div className="w-full max-w-4xl text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-[#9b1b3d] sm:text-5xl">
            Pilih konsepmu
          </h1>
          <p className="mx-auto mt-3 max-w-md text-pretty text-base leading-relaxed text-[#6f2c42] sm:text-lg">
            Ketuk salah satu animasi untuk melanjutkan.
          </p>

          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:mt-14 sm:gap-8">
            <LottieChoiceCard
              href="/heart"
              label="Heart"
              description="Hangat, penuh cinta, dan berdetak riang."
              src={LOTTIE_HEART}
              variant="heart"
            />
            <LottieChoiceCard
              href="/broken-heart"
              label="Broken Heart"
              description="Sunyi, rapuh, dan sedang menyembuhkan diri."
              src={LOTTIE_BROKEN_HEART}
              variant="broken"
            />
          </div>
        </div>
      </main>
    </BirthdateGate>
  );
}