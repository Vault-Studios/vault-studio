import type { Metadata } from "next";
import VaultHome from "../components/VaultHome";

export const metadata: Metadata = {
  title: "Vault — Studio ya Picha na Filamu",
  description: "Picha za kisinema, nyaraka, matukio na filamu kutoka Dar es Salaam, Tanzania.",
  alternates: { canonical: "/sw", languages: { en: "/", sw: "/sw" } },
};

export default function SwahiliHome() {
  return <VaultHome locale="sw" />;
}
