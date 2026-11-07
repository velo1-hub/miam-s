import { Skeleton } from "@/components/ui/skeleton";

export default function VehicleLoading() {
  return (
    <div className="container-content pb-28 pt-28 md:pt-36" aria-busy="true">
      <Skeleton className="mb-6 h-5 w-48" />
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <Skeleton className="aspect-video rounded-hero" />
        <Skeleton className="h-[460px] rounded-card" />
      </div>
    </div>
  );
}
