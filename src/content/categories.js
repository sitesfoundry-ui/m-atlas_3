const t = (en, mn) => ({ en, mn });

export const categories = {
  birds: [
    { slug: "songbirds", icon: "i-songbird", count: 34, specimen: "blue-jay", label: t("Songbirds", "Жиргээчид") },
    { slug: "kingfishers", icon: "i-kingfisher", count: 8, specimen: "kingfisher", label: t("Kingfishers", "Загасчин") },
    { slug: "owls", icon: "i-owl", count: 11, specimen: "screech-owl", label: t("Owls", "Шар шувуу") },
    { slug: "hummingbirds", icon: "i-hummingbird", count: 15, specimen: "hummingbird", label: t("Hummingbirds", "Колибри") },
    { slug: "raptors", icon: "i-raptor", count: 12, specimen: "golden-eagle", label: t("Raptors", "Махчин") },
    { slug: "waders", icon: "i-wader", count: 9, specimen: "boat-billed-heron", label: t("Waders", "Усны шувуу") },
  ],
  myths: [
    { slug: "fire-birds", icon: "i-flame", count: 6, specimen: "phoenix", label: t("Fire birds", "Галт шувуу") },
    { slug: "sea-monsters", icon: "i-wave", count: 14, specimen: "kraken", label: t("Sea monsters", "Далайн мангас") },
    { slug: "dragons", icon: "i-claw", count: 22, specimen: "dragon", label: t("Dragons", "Луу") },
    { slug: "chimeras", icon: "i-skull", count: 9, specimen: "griffin", label: t("Chimeras", "Химер") },
    { slug: "giants", icon: "i-peak", count: 11, specimen: "titan", label: t("Giants", "Аварга") },
    { slug: "tricksters", icon: "i-mask", count: 8, specimen: "kappa", label: t("Tricksters", "Мэхлэгч") },
  ],
};
