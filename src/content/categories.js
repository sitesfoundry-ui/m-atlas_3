const t = (en, mn) => ({ en, mn });

export const categories = {
  birds: [
    { slug: "songbirds", icon: "i-songbird", count: 34, label: t("Songbirds", "Жиргээчид") },
    { slug: "kingfishers", icon: "i-kingfisher", count: 8, specimen: "kingfisher", label: t("Kingfishers", "Загасчин") },
    { slug: "owls", icon: "i-owl", count: 11, label: t("Owls", "Шар шувуу") },
    { slug: "hummingbirds", icon: "i-hummingbird", count: 15, label: t("Hummingbirds", "Колибри") },
    { slug: "raptors", icon: "i-raptor", count: 12, label: t("Raptors", "Махчин") },
    { slug: "waders", icon: "i-wader", count: 9, label: t("Waders", "Усны шувуу") },
  ],
  myths: [
    { slug: "fire-birds", icon: "i-flame", count: 6, specimen: "phoenix", label: t("Fire birds", "Галт шувуу") },
    { slug: "sea-monsters", icon: "i-wave", count: 14, specimen: "kraken", label: t("Sea monsters", "Далайн мангас") },
    { slug: "dragons", icon: "i-claw", count: 22, label: t("Dragons", "Луу") },
    { slug: "chimeras", icon: "i-skull", count: 9, label: t("Chimeras", "Химер") },
    { slug: "giants", icon: "i-peak", count: 11, label: t("Giants", "Аварга") },
    { slug: "tricksters", icon: "i-mask", count: 8, label: t("Tricksters", "Мэхлэгч") },
  ],
};
