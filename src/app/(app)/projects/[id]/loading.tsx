import { Skeleton } from "@/components/ui/skeleton";

export default function CargandoTablero() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Skeleton className="mb-4 h-8 w-36" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-5 w-96 max-w-full" />

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
