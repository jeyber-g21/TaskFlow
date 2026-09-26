"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { crearProyecto, editarProyecto } from "@/app/(app)/actions";
import { FieldError } from "@/components/auth/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resolverZod } from "@/lib/validations/resolver";
import { projectSchema, type ProjectInput } from "@/lib/validations/workspace";

type ProyectoExistente = {
  id: string;
  name: string;
  description: string | null;
};

/**
 * El formulario vive en su propio componente porque Radix desmonta el
 * contenido del diálogo al cerrarlo: así se reinicia solo cada vez que se
 * abre, sin necesidad de sincronizar estado con un efecto.
 */
function FormularioProyecto({
  proyecto,
  alTerminar,
}: {
  proyecto?: ProyectoExistente;
  alTerminar: () => void;
}) {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const editando = Boolean(proyecto);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput>({
    resolver: resolverZod(projectSchema),
    defaultValues: {
      name: proyecto?.name ?? "",
      description: proyecto?.description ?? "",
    },
  });

  async function onSubmit(values: ProjectInput) {
    setErrorServidor(null);

    const resultado = proyecto
      ? await editarProyecto(proyecto.id, values)
      : await crearProyecto(values);

    if (resultado.status === "error") {
      setErrorServidor(resultado.message);
      return;
    }

    toast.success(editando ? "Proyecto actualizado" : "Proyecto creado");
    alTerminar();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {errorServidor && (
        <Alert variant="destructive">
          <AlertDescription>{errorServidor}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="project-name">Nombre</Label>
        <Input
          id="project-name"
          autoFocus
          placeholder="Rediseño del onboarding"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-description">
          Descripción <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="project-description"
          rows={3}
          placeholder="Qué se quiere conseguir con este proyecto"
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={alTerminar}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {editando ? "Guardar cambios" : "Crear proyecto"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Sirve para crear y para editar: son el mismo formulario con los mismos
 * límites, y separarlos solo obligaría a mantener dos copias sincronizadas.
 *
 * Puede funcionar solo (con su propio botón) o controlado desde fuera, que es
 * como lo usa el menú de cada tarjeta.
 */
export function ProjectDialog({
  proyecto,
  children,
  abierto,
  onAbiertoChange,
}: {
  proyecto?: ProyectoExistente;
  children?: ReactNode;
  abierto?: boolean;
  onAbiertoChange?: (valor: boolean) => void;
}) {
  const [abiertoInterno, setAbiertoInterno] = useState(false);

  const esControlado = abierto !== undefined;
  const estaAbierto = esControlado ? abierto : abiertoInterno;
  const cambiarApertura = esControlado ? onAbiertoChange! : setAbiertoInterno;

  const editando = Boolean(proyecto);

  return (
    <Dialog open={estaAbierto} onOpenChange={cambiarApertura}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editando ? "Editar proyecto" : "Nuevo proyecto"}
          </DialogTitle>
          <DialogDescription>
            {editando
              ? "Cambia el nombre o la descripción del proyecto."
              : "Agrupa en un proyecto el trabajo de una misma iniciativa."}
          </DialogDescription>
        </DialogHeader>

        <FormularioProyecto
          proyecto={proyecto}
          alTerminar={() => cambiarApertura(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
