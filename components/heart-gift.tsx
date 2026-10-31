"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Caveat, Dancing_Script } from "next/font/google";

/* ============================================================================
 * ISI & PENGATURAN: ubah teks, foto, dan surat di sini.
 * ========================================================================== */

const CONTENT = {
  giftTitle: "Untukmu, sayangku.",
  giftHint: "(ketuk untuk membuka)",
  messageTitle: "Dariku untukmu.",
  messageSub: "Sebesar inilah aku mencintaimu.",
  letter: `Untuk Sayangku,

Aku menulis surat kecil ini hanya karena kamu ada di pikiranku sepanjang hari. Dan jujur saja, itu bukan hal baru, karena kamu memang selalu tinggal di sana.

Terima kasih sudah menjadi tempatku pulang, di hari yang ringan maupun yang berat. Kamu membuat hal-hal biasa terasa istimewa, dan aku bersyukur untuk setiap detik bersamamu.

Apa pun yang terjadi nanti, aku ingin terus menggenggam tanganmu.

Dengan seluruh cintaku,
Yang selalu menyayangimu`,
  finalTitle: "Aku akan selalu mencintaimu",
  finalSub: "Dari, selamanya milikmu",
};

type Photo = { src: string; alt: string };

/**
 * Foto polaroid (maksimal 8). Taruh gambar di folder `public/photos/`, lalu isi:
 *   { src: "/photos/1.jpg", alt: "Kita di pantai" },
 * Dibiarkan kosong = tampil kartu polaroid cadangan.
 */
const PHOTOS: Photo[] = [];

/** Kecepatan mengetik surat (ms per huruf). */
const TYPE_MS = 28;

/** Lama tiap adegan otomatis (ms) sebelum lanjut ke adegan berikutnya. */
const DURATION = { flowers: 5600, message: 4400, photos: 7600 } as const;

/* ============================================================================
 * Font & util
 * ========================================================================== */

const script = Dancing_Script({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});
const hand = Caveat({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

type Scene = "gift" | "flowers" | "message" | "photos" | "letter" | "final";
const ORDER: Scene[] = ["gift", "flowers", "message", "photos", "letter", "final"];

const INK = "#9b1b3d"; // judul (kontras tinggi di atas krem/pink pucat)
const INK_SOFT = "#6f2c42"; // teks kecil

/** Pseudo-random berbasis seed: hasil selalu sama (aman untuk SSR/hidrasi). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ============================================================================
 * Data bunga kertas
 * ========================================================================== */

const FLOWER_COLORS = [
  { petal: "#e8453c", inner: "#f47c6b", core: "#7a1d1d" }, // merah
  { petal: "#f28b30", inner: "#f9b15d", core: "#8a3f0b" }, // oranye
  { petal: "#f7d56a", inner: "#fbe8a0", core: "#a8761a" }, // kuning
  { petal: "#5b8def", inner: "#9ab9f7", core: "#1f3f8f" }, // biru
  { petal: "#8f7be8", inner: "#bdb0f3", core: "#43318f" }, // ungu
  { petal: "#7fd1c0", inner: "#b6e8dc", core: "#1f6b5c" }, // mint
  { petal: "#f4a6c0", inner: "#f9cfe0", core: "#a3365f" }, // pink
  { petal: "#f3eee6", inner: "#ffffff", core: "#b59a6a" }, // krem
  { petal: "#79b98a", inner: "#aedbb9", core: "#2c6a3d" }, // hijau
];

type FlowerSpec = {
  x: number;
  y: number;
  size: number;
  rot: number;
  color: number;
  ring: number;
};

const FLOWERS: FlowerSpec[] = (() => {
  const rand = rng(2024);
  const list: FlowerSpec[] = [];
  const RINGS = 9;
  for (let ring = 0; ring < RINGS; ring++) {
    if (ring === 0) {
      list.push({ x: 0, y: 0, size: 96, rot: 0, color: 0, ring });
      continue;
    }
    const r = ring * 62;
    const size = 84 + ring * 6;
    const count = Math.max(6, Math.round((2 * Math.PI * r) / (size * 0.72)));
    const offset = rand() * Math.PI * 2;
    for (let k = 0; k < count; k++) {
      const a = offset + (k / count) * Math.PI * 2;
      list.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        size: size * (0.9 + rand() * 0.25),
        rot: rand() * 360,
        color: Math.floor(rand() * FLOWER_COLORS.length),
        ring,
      });
    }
  }
  // Gambar dari luar ke dalam agar bunga tengah berada paling atas.
  return list.reverse();
})();

/* ============================================================================
 * Kelopak berjatuhan
 * ========================================================================== */

const PETAL_BG = [
  "radial-gradient(circle at 35% 30%, #ffffff 0%, #ffd0de 45%, #f48fb1 100%)",
  "radial-gradient(circle at 35% 30%, #ffffff 0%, #ffc2d4 45%, #f06292 100%)",
  "radial-gradient(circle at 35% 30%, #fff5f8 0%, #ffdbe6 50%, #f8a5c2 100%)",
];

const PETALS = (() => {
  const r = rng(77);
  return Array.from({ length: 24 }, () => ({
    left: r() * 100,
    size: 8 + r() * 16,
    dur: 9 + r() * 8,
    delay: r() * 14,
    sway: (r() - 0.5) * 120,
    bg: Math.floor(r() * PETAL_BG.length),
  }));
})();

const WATERCOLOR =
  "radial-gradient(60% 50% at 18% 18%, #fbd3df 0%, transparent 70%)," +
  "radial-gradient(55% 45% at 86% 28%, #f9c9d8 0%, transparent 70%)," +
  "radial-gradient(75% 60% at 50% 95%, #fde0e8 0%, transparent 75%)," +
  "#fdf3f6";

const CSS = `
@keyframes hg-fall{0%{transform:translate3d(0,-12vh,0) rotate(0deg)}50%{transform:translate3d(var(--sway,0px),50vh,0) rotate(120deg)}100%{transform:translate3d(0,112vh,0) rotate(240deg)}}
@keyframes hg-float{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-10px) rotate(1deg)}}
@keyframes hg-drift-a{0%,100%{transform:translate(0,0)}50%{transform:translate(8vw,6vh)}}
@keyframes hg-drift-b{0%,100%{transform:translate(0,0)}50%{transform:translate(-9vw,-5vh)}}
@keyframes hg-caret{0%,49%{opacity:1}50%,100%{opacity:0}}
.hg-petal{position:absolute;top:0;border-radius:60% 40% 55% 45%;opacity:.8;animation:hg-fall linear infinite;will-change:transform}
.hg-float{animation:hg-float 3.4s ease-in-out infinite}
.hg-drift-a{animation:hg-drift-a 22s ease-in-out infinite}
.hg-drift-b{animation:hg-drift-b 26s ease-in-out infinite}
.hg-caret{display:inline-block;width:2px;height:1.1em;margin-left:2px;vertical-align:-0.15em;background:${INK};animation:hg-caret 1s steps(1) infinite}
@media (prefers-reduced-motion:reduce){.hg-petal{display:none}.hg-float,.hg-drift-a,.hg-drift-b,.hg-caret{animation:none}}
`;

/* ============================================================================
 * Komponen utama
 * ========================================================================== */

export function HeartGift() {
  const reduce = !!useReducedMotion();
  const [scene, setScene] = useState<Scene>("gift");
  const [opening, setOpening] = useState(false);

  const openTimer = useRef<number | null>(null);
  const giftRef = useRef<HTMLButtonElement | null>(null);
  const againRef = useRef<HTMLButtonElement | null>(null);
  const replayed = useRef(false);

  const next = useCallback(() => {
    setScene((s) => ORDER[Math.min(ORDER.indexOf(s) + 1, ORDER.length - 1)]);
  }, []);

  const openGift = useCallback(() => {
    if (opening) return;
    setOpening(true);
    openTimer.current = window.setTimeout(() => setScene("flowers"), reduce ? 150 : 750);
  }, [opening, reduce]);

  const replay = useCallback(() => {
    replayed.current = true;
    setOpening(false);
    setScene("gift");
  }, []);

  // Lanjut otomatis untuk adegan yang berdurasi tetap.
  useEffect(() => {
    if (scene !== "flowers" && scene !== "message" && scene !== "photos") return;
    const ms = scene === "flowers" && reduce ? 1500 : DURATION[scene];
    const id = window.setTimeout(next, ms);
    return () => window.clearTimeout(id);
  }, [scene, reduce, next]);

  // Bersihkan timer saat komponen dilepas.
  useEffect(() => {
    return () => {
      if (openTimer.current) window.clearTimeout(openTimer.current);
    };
  }, []);

  // Pengelolaan fokus.
  useEffect(() => {
    if (scene === "final") againRef.current?.focus({ preventScroll: true });
    if (scene === "gift" && replayed.current) {
      giftRef.current?.focus({ preventScroll: true });
      replayed.current = false;
    }
  }, [scene]);

  const pink =
    scene === "message" || scene === "photos" || scene === "letter" || scene === "final";

  const announcement: Record<Scene, string> = {
    gift: "",
    flowers: "Bunga-bunga bermekaran.",
    message: `${CONTENT.messageTitle} ${CONTENT.messageSub}`,
    photos: "Kumpulan foto kenangan kita.",
    letter: CONTENT.letter.replace(/\n+/g, " "),
    final: `${CONTENT.finalTitle}. ${CONTENT.finalSub}`,
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#fbf7f1] text-[#3b2a2f]">
      <style>{CSS}</style>

      {/* Latar cat air (muncul setelah bunga) */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: WATERCOLOR }}
        initial={false}
        animate={{ opacity: pink ? 1 : 0 }}
        transition={{ duration: reduce ? 0.2 : 1.4 }}
      >
        <div className="hg-drift-a absolute -left-24 top-8 size-[26rem] rounded-full bg-pink-300/40 blur-3xl" />
        <div className="hg-drift-b absolute -right-24 bottom-4 size-[30rem] rounded-full bg-rose-200/60 blur-3xl" />
      </motion.div>

      {/* Kelopak berjatuhan */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        initial={false}
        animate={{ opacity: pink ? 1 : 0 }}
        transition={{ duration: 1.2 }}
      >
        {pink &&
          PETALS.map((p, i) => (
            <span
              key={i}
              className="hg-petal"
              style={
                {
                  left: `${p.left}%`,
                  width: p.size,
                  height: p.size,
                  background: PETAL_BG[p.bg],
                  animationDuration: `${p.dur}s`,
                  animationDelay: `${-p.delay}s`,
                  "--sway": `${p.sway}px`,
                } as CSSProperties
              }
            />
          ))}
      </motion.div>

      {/* Adegan */}
      <AnimatePresence>
        {scene === "gift" && (
          <GiftScene key="gift" opening={opening} onOpen={openGift} buttonRef={giftRef} reduce={reduce} />
        )}
        {scene === "flowers" && <FlowerScene key="flowers" reduce={reduce} />}
        {scene === "message" && <MessageScene key="message" />}
        {scene === "photos" && <PhotosScene key="photos" reduce={reduce} />}
        {scene === "letter" && <LetterScene key="letter" reduce={reduce} onDone={next} />}
        {scene === "final" && <FinalScene key="final" buttonRef={againRef} onReplay={replay} />}
      </AnimatePresence>

      {/* Kontrol tetap */}
      <Link
        href="/"
        className="absolute left-4 top-4 z-30 inline-flex min-h-11 items-center rounded-full bg-white/85 px-4 text-sm font-semibold text-[#7a1a38] ring-1 ring-[#e9b6c5] backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b1b3d]"
      >
        <span aria-hidden="true" className="mr-1.5">←</span> Kembali
      </Link>

      {scene !== "gift" && scene !== "final" && (
        <button
          type="button"
          onClick={next}
          className="absolute bottom-5 right-5 z-30 inline-flex min-h-11 items-center rounded-full bg-white/85 px-5 text-sm font-semibold text-[#7a1a38] ring-1 ring-[#e9b6c5] backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b1b3d]"
        >
          Lanjut <span aria-hidden="true" className="ml-1.5">→</span>
        </button>
      )}

      {/* Pengumuman untuk pembaca layar */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement[scene]}
      </p>
    </main>
  );
}

export default HeartGift;

/* ============================================================================
 * Adegan 1: kado sketsa
 * ========================================================================== */

function GiftScene({
  opening,
  onOpen,
  buttonRef,
  reduce,
}: {
  opening: boolean;
  onOpen: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
  reduce: boolean;
}) {
  return (
    <motion.div
      className="absolute inset-0 grid place-items-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={onOpen}
        aria-label={`Buka hadiah. ${CONTENT.giftTitle}`}
        className="group flex flex-col items-center gap-4 rounded-3xl p-6 transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b1b3d] focus-visible:ring-offset-4 focus-visible:ring-offset-[#fbf7f1] active:scale-100 motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        <span className="hg-float block w-44 sm:w-56" aria-hidden="true">
          <svg viewBox="0 0 160 170" className="h-auto w-full overflow-visible" focusable="false">
            <defs>
              <filter id="hg-sketch" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
              </filter>
              <pattern id="hg-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="#fff0f3" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="#e0466a" strokeWidth="1.5" />
              </pattern>
            </defs>

            <g filter="url(#hg-sketch)" stroke="#d6335a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              {/* badan kotak */}
              <rect x="28" y="80" width="104" height="76" rx="3" fill="url(#hg-hatch)" />
              <rect x="72" y="80" width="16" height="76" fill="#fff0f3" />

              {/* tutup + pita */}
              <motion.g
                animate={opening && !reduce ? { y: -34, rotate: -10 } : { y: 0, rotate: 0 }}
                transition={{ type: "spring", stiffness: 160, damping: 11 }}
              >
                <rect x="20" y="60" width="120" height="24" rx="3" fill="url(#hg-hatch)" />
                <rect x="72" y="60" width="16" height="24" fill="#fff0f3" />
                <path d="M80 60C60 32 30 38 44 56C52 64 72 62 80 60Z" fill="url(#hg-hatch)" />
                <path d="M80 60C100 32 130 38 116 56C108 64 88 62 80 60Z" fill="url(#hg-hatch)" />
                <path d="M78 62C70 76 62 82 56 86" fill="none" />
                <path d="M82 62C90 76 98 82 104 86" fill="none" />
                <circle cx="80" cy="59" r="6.5" fill="url(#hg-hatch)" />
              </motion.g>
            </g>
          </svg>
        </span>

        <span className={`${script.className} text-3xl font-medium sm:text-4xl`} style={{ color: INK }}>
          {CONTENT.giftTitle}
        </span>
        <span className={`${hand.className} -mt-2 text-lg`} style={{ color: INK_SOFT }}>
          {CONTENT.giftHint}
        </span>
      </button>
    </motion.div>
  );
}

/* ============================================================================
 * Adegan 2: bunga kertas mekar lalu "masuk" ke terowongan bunga
 * ========================================================================== */

function FlowerScene({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      aria-hidden="true"
    >
      <motion.div
        className="absolute inset-0 will-change-transform"
        initial={{ scale: 1 }}
        animate={{ scale: reduce ? 1 : 2.4 }}
        transition={{ duration: 2.6, delay: 3, ease: [0.5, 0, 0.9, 0.6] }}
      >
        <svg
          viewBox="-500 -500 1000 1000"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
          focusable="false"
        >
          <defs>
            {FLOWER_COLORS.map((c, i) => (
              <symbol key={i} id={`hg-fl-${i}`} viewBox="-50 -50 100 100">
                {Array.from({ length: 8 }, (_, k) => (
                  <ellipse
                    key={`o${k}`}
                    cx="0"
                    cy="-27"
                    rx="15"
                    ry="22"
                    fill={c.petal}
                    stroke="rgba(0,0,0,0.14)"
                    strokeWidth="1"
                    transform={`rotate(${k * 45})`}
                  />
                ))}
                {Array.from({ length: 6 }, (_, k) => (
                  <ellipse
                    key={`i${k}`}
                    cx="0"
                    cy="-15"
                    rx="10"
                    ry="15"
                    fill={c.inner}
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth="0.8"
                    transform={`rotate(${k * 60 + 30})`}
                  />
                ))}
                <circle r="9" fill={c.core} opacity="0.85" />
                <circle r="4.5" fill="#ffe9a8" />
              </symbol>
            ))}
          </defs>

          <motion.g
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 90, ease: "linear", repeat: Infinity }}
          >
            {FLOWERS.map((f, i) => (
              <g key={i} transform={`translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${f.rot.toFixed(0)})`}>
                <motion.g
                  initial={reduce ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 14,
                    delay: reduce ? 0 : 0.15 + f.ring * 0.28 + (i % 7) * 0.02,
                  }}
                >
                  <use
                    href={`#hg-fl-${f.color}`}
                    x={-f.size / 2}
                    y={-f.size / 2}
                    width={f.size}
                    height={f.size}
                  />
                </motion.g>
              </g>
            ))}
          </motion.g>
        </svg>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================================
 * Adegan 3: "Dariku untukmu."
 * ========================================================================== */

function MessageScene() {
  return (
    <motion.div
      className="absolute inset-0 grid place-items-center px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
    >
      <div>
        <motion.h1
          className={`${script.className} text-balance text-5xl font-medium sm:text-7xl`}
          style={{ color: INK }}
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.1, delay: 0.5 }}
        >
          {CONTENT.messageTitle}
        </motion.h1>
        <motion.p
          className={`${hand.className} mt-4 text-balance text-2xl sm:text-3xl`}
          style={{ color: INK_SOFT }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          {CONTENT.messageSub}
        </motion.p>
      </div>
    </motion.div>
  );
}

/* ============================================================================
 * Adegan 4: foto polaroid meluncur masuk
 * ========================================================================== */

const TILT = [-4, 3, -2, 5, -5, 2, 4, -3];
const PLACEHOLDER_BG = [
  "linear-gradient(135deg,#ffd9e2,#ffb3c7)",
  "linear-gradient(135deg,#ffe6cf,#ffc29a)",
  "linear-gradient(135deg,#e5dcff,#c4b5f5)",
  "linear-gradient(135deg,#d6f1ea,#a8dccf)",
];

function PhotosScene({ reduce }: { reduce: boolean }) {
  const items: (Photo | null)[] = PHOTOS.length
    ? PHOTOS.slice(0, 8)
    : Array.from({ length: 8 }, () => null);

  return (
    <motion.div
      className="absolute inset-0 grid place-items-center overflow-hidden px-4 py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="sr-only">Foto kenangan kita</h1>
      <ul className="grid w-full max-w-3xl list-none grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-4">
        {items.map((photo, i) => (
          <motion.li
            key={i}
            className={i >= 6 ? "hidden sm:block" : undefined}
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, x: i % 2 ? 150 : -150, rotate: TILT[i] * 3 }
            }
            animate={{ opacity: 1, x: 0, rotate: TILT[i] }}
            transition={{
              type: "spring",
              stiffness: 90,
              damping: 14,
              delay: reduce ? 0 : 0.2 + i * 0.32,
            }}
          >
            <figure className="bg-white p-2 pb-7 shadow-[0_8px_24px_rgba(155,27,61,0.18)]">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.src}
                  alt={photo.alt}
                  decoding="async"
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="grid aspect-square w-full place-items-center"
                  style={{ background: PLACEHOLDER_BG[i % PLACEHOLDER_BG.length] }}
                >
                  <svg viewBox="0 0 100 100" className="w-2/5 opacity-80" focusable="false">
                    <path
                      d="M50 88C20 66 6 48 6 31C6 18 16 9 28 9C38 9 46 15 50 22C54 15 62 9 72 9C84 9 94 18 94 31C94 48 80 66 50 88Z"
                      fill="#fff"
                    />
                  </svg>
                </div>
              )}
            </figure>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ============================================================================
 * Adegan 5: surat yang diketik
 * ========================================================================== */

function LetterScene({ reduce, onDone }: { reduce: boolean; onDone: () => void }) {
  const full = CONTENT.letter;
  const [count, setCount] = useState(reduce ? full.length : 0);
  const paperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduce) {
      const id = window.setTimeout(onDone, 7000);
      return () => window.clearTimeout(id);
    }

    let typing: number | undefined;
    let finish: number | undefined;
    const start = window.setTimeout(() => {
      let i = 0;
      typing = window.setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= full.length) {
          window.clearInterval(typing);
          finish = window.setTimeout(onDone, 3200);
        }
      }, TYPE_MS);
    }, 900);

    return () => {
      window.clearTimeout(start);
      if (typing) window.clearInterval(typing);
      if (finish) window.clearTimeout(finish);
    };
  }, [reduce, full, onDone]);

  // Gulir otomatis mengikuti teks yang sedang diketik.
  useEffect(() => {
    const el = paperRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  return (
    <motion.div
      className="absolute inset-0 grid place-items-center px-4 py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="sr-only">Sebuah surat untukmu</h1>
      <motion.div
        className="w-full max-w-xl"
        initial={reduce ? false : { opacity: 0, y: 40, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: reduce ? 0 : -0.6 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Teks lengkap dibacakan lewat pengumuman; tampilan ketikan disembunyikan dari pembaca layar */}
        <div
          ref={paperRef}
          aria-hidden="true"
          className={`${hand.className} h-[min(72dvh,36rem)] overflow-y-auto rounded-sm bg-[#fffdf7] px-6 py-8 text-[1.35rem] leading-[1.75rem] text-[#3b2a2f] shadow-[0_18px_50px_rgba(155,27,61,0.22),0_0_0_1px_rgba(0,0,0,0.04)] sm:px-10 sm:text-[1.55rem] sm:leading-8`}
        >
          <p className="whitespace-pre-wrap">
            {full.slice(0, count)}
            {count < full.length && <span className="hg-caret" />}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================================
 * Adegan 6: penutup
 * ========================================================================== */

function FinalScene({
  buttonRef,
  onReplay,
}: {
  buttonRef: RefObject<HTMLButtonElement | null>;
  onReplay: () => void;
}) {
  return (
    <motion.div
      className="absolute inset-0 grid place-items-center px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
    >
      <div>
        <motion.h1
          className={`${script.className} text-balance text-5xl font-medium sm:text-7xl`}
          style={{ color: INK }}
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3 }}
        >
          {CONTENT.finalTitle}
        </motion.h1>
        <motion.p
          className={`${hand.className} mt-4 text-2xl sm:text-3xl`}
          style={{ color: INK_SOFT }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          {CONTENT.finalSub}
        </motion.p>

        <motion.div
          className="mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.8 }}
        >
          <button
            ref={buttonRef}
            type="button"
            onClick={onReplay}
            className="inline-flex min-h-11 items-center rounded-full bg-[#9b1b3d] px-7 font-semibold text-white shadow-lg shadow-rose-900/20 transition hover:bg-[#7f1531] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b1b3d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdf3f6]"
          >
            Putar ulang
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
