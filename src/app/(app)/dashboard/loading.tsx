import { Skeleton } from "@/components/ui/skeleton";

/**
 * Se ve mientras el servidor consulta los proyectos. Imita la forma de la
 * pantalla real para que al llegar los datos no salte todo de sitio.
 */
export default function CargandoPanel() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
