import { motion } from "framer-motion";

export function PageHero({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <section className="relative pt-16 pb-12 md:pt-24 md:pb-16 bg-hero-gradient overflow-hidden">
      <div className="absolute inset-0 [background:var(--gradient-radial-gold)] opacity-50" />
      <div className="container relative mx-auto px-4 md:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-4">
            {eyebrow}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
            <span className="text-gold-gradient">{title}</span>
          </h1>
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
          )}
        </motion.div>
      </div>
    </section>
  );
}