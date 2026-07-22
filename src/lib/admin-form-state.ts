// Estado que devuelven las Server Actions usadas con useActionState.
//
// Vive en su propio fichero porque `admin-actions.ts` es "use server": ahí solo
// pueden exportarse funciones async, no tipos ni constantes.

export interface FormState {
  /** Mensaje de error general (o del campo que falló). */
  error?: string;
  /** true cuando la acción terminó bien (para mostrar "Guardado"). */
  ok?: boolean;
}

export const EMPTY_FORM_STATE: FormState = {};
