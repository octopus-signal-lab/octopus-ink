import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Octopus Ink · OctoSignal Lab",
    short_name: "Octopus Ink",
    description:
      "A local Markdown viewer and editor with two lenses — rendered Visual and Raw source. 100% client-side; nothing is ever uploaded.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0e0b07",
    theme_color: "#0e0b07",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
