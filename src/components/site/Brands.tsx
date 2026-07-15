const brands = ["Mobil 1", "Shell Helix", "Castrol", "Total", "Liqui Moly", "Valvoline", "ENI", "Motul", "Repsol", "Elf"];

export function Brands() {
  const doubled = [...brands, ...brands];
  return (
    <section className="py-12 md:py-16 border-y border-border bg-card/40 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 mb-6">
        <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-[0.25em]">
          أفضل العلامات التجارية العالمية
        </p>
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="flex marquee gap-12 whitespace-nowrap">
          {doubled.map((b, i) => (
            <div key={i} className="text-2xl md:text-3xl font-extrabold text-foreground/40 hover:text-primary transition-colors shrink-0">
              {b}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
