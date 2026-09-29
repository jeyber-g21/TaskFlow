import { Skeleton } from "@/components/ui/skeleton";

export default function CargandoAjustes() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Skeleton className="mb-4 h-8 w-36" />
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-5 w-44" />

      <Skeleton className="mt-8 h-56 rounded-xl" />
      <Skeleton className="mt-6 h-48 rounded-xl" />
    </div>
  );
}
