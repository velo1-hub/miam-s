import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Settings } from "@/lib/settings/types";
import { HeroButtons } from "./hero-buttons";
import { HeroSearch } from "./hero-search";
import { HeroVideo, type HeroSources } from "./hero-video";
import { HeroCopy } from "./hero-copy";

interface Props {
  settings: Settings;
  sources: HeroSources;
  makes: { value: string; models: string[] }[];
}

/** Hero — brief §6.1: 100svh, video loop, content bottom-left max 760, two buttons, AI search, pause control, scroll cue. */
export async function Hero({ settings, sources, makes }: Props) {
  const t = await getTranslations("home");
  return (
    <section id="hero" className="relative flex min-h-svh flex-col justify-end overflow-hidden">
      <HeroVideo sources={sources} />
      <div className="container-content relative z-10 pb-[max(48px,env(safe-area-inset-bottom))] pt-40">
        <div className="max-w-[760px]">
          <HeroCopy eyebrow={t("eyebrow", { city: settings.business.city })} headline={t("headline")} subline={t("subline")} />
          <HeroButtons>
            <Button asChild variant="primary" size="lg">
              <Link href="/inventory">{t("ctaInventory")}</Link>
            </Button>
          </HeroButtons>
        </div>
        <HeroSearch makes={makes} className="mt-8 max-w-[760px]" />
      </div>
      <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-1 text-caption text-text-3 md:flex" aria-hidden>
        <span className="relative block h-8 w-px overflow-hidden bg-white/10">
          <span className="absolute inset-x-0 top-0 h-full bg-text motion-safe:animate-[scroll-cue_1.8s_var(--ease-in-out)_infinite]" />
        </span>
        <ChevronDown className="size-3.5" strokeWidth={1.5} />
      </div>
    </section>
  );
}
