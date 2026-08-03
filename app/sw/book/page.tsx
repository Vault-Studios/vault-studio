import type { Metadata } from "next";
import BookPage from "../../book/page";

export const metadata: Metadata = { title: "Weka nafasi ya mradi" };

export default function SwahiliBookPage() {
  return <BookPage locale="sw" />;
}
