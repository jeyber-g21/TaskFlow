import type { TaskPriorityValue, TaskStatusValue } from "@/lib/validations/task";

/**
 * Contenido de ejemplo para un equipo recién creado.
 *
 * Un panel vacío no enseña nada: quien entra por primera vez —o quien abre la
 * demo— no llega a ver el tablero hasta que se inventa tareas. Con esto se ve
 * la aplicación funcionando desde el primer segundo, y queda claro que son
 * datos de muestra para borrar.
 */

export const PROYECTO_DE_EJEMPLO = {
  nombre: "Lanzamiento de la web",
  descripcion:
    "Proyecto de ejemplo para ver el tablero en marcha. Puedes borrarlo cuando quieras.",
};

type TareaDeEjemplo = {
  titulo: string;
  descripcion: string | null;
  estado: TaskStatusValue;
  prioridad: TaskPriorityValue;
  /** Si es true, se asigna a quien crea el equipo. */
  mia: boolean;
};

export const TAREAS_DE_EJEMPLO: TareaDeEjemplo[] = [
  {
    titulo: "Escribir los textos de la página de inicio",
    descripcion: "Hero, tres beneficios y la llamada a la acción final.",
    estado: "todo",
    prioridad: "high",
    mia: true,
  },
  {
    titulo: "Preparar las imágenes para móvil",
    descripcion: "Que no pesen más de 200 KB cada una.",
    estado: "todo",
    prioridad: "medium",
    mia: false,
  },
  {
    titulo: "Revisar la ortografía de los formularios",
    descripcion: null,
    estado: "todo",
    prioridad: "low",
    mia: false,
  },
  {
    titulo: "Montar la plantilla de correo de bienvenida",
    descripcion: "Con el logo y un enlace para darse de baja.",
    estado: "in_progress",
    prioridad: "high",
    mia: true,
  },
  {
    titulo: "Conectar el formulario de contacto",
    descripcion: "Que avise por email cuando alguien escriba.",
    estado: "in_progress",
    prioridad: "medium",
    mia: false,
  },
  {
    titulo: "Elegir la paleta de colores",
    descripcion: "Una neutra y un acento, nada más.",
    estado: "done",
    prioridad: "medium",
    mia: true,
  },
  {
    titulo: "Reservar el dominio",
    descripcion: null,
    estado: "done",
    prioridad: "high",
    mia: true,
  },
];
