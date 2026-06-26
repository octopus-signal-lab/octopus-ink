import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Octopus Ink — Read & write Markdown, two ways · OctoSignal Lab",
  description:
    "Octopus Ink is a free, open-source app that opens your local Markdown files in two lenses — a rendered Visual view and the Raw source. 100% local, no account, nothing uploaded.",
};

export default function SplashLayout({ children }: { children: React.ReactNode }) {
  return children;
}
