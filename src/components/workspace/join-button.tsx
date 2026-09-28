"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { aceptarInvitacion } from "@/app/(app)/settings/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { esErrorDeRedireccion } from "@/lib/errors";

export function JoinButton({
  token,
  nombreEquipo,
}: {
  token: string;
  nombreEquipo: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [uniendose, setUniendose] = useState(false);

  async function unirse() {
    setError(null);
    setUniendose(true);

    try {
      const resultado = await aceptarInvitacion(token);
      // Si sale bien, la acción redirige al panel y esto no se ejecuta.
      if (resultado?.status === "error") {
        setError(resultado.message);
        setUniendose(false);
      }
    } catch (e) {
      if (esErrorDeRedireccion(e)) throw e;
      setError("No hemos podido conectar. Inténtalo de nuevo.");
      setUniendose(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button onClick={unirse} disabled={uniendose} className="w-full">
        {uniendose && <Loader2 className="animate-spin" />}
        {uniendose ? "Uniéndote…" : `Unirme a ${nombreEquipo}`}
      </Button>
    </div>
  );
}
