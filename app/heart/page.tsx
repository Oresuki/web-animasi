import type { Metadata } from "next";

import { HeartGift } from "@/components/heart-gift";

export const metadata: Metadata = {
  title: "Untukmu",
  description: "Sebuah hadiah kecil untukmu.",
};

export default function HeartPage() {
  return <HeartGift />;
}