import { useState } from "react";

// <T> representa los valores del formulario (ej. PlanFormValues)
export type StepConfig<T> = {
  title: string;
  icon?: unknown; // O el tipo de tus íconos
  fields: (keyof T)[]; // TS obligará a que sean campos válidos de tu schema
};

type UseStepper<T> = {
  stepIndex: number;
  currentStep: StepConfig<T>;
  isFirstStep: boolean;
  isLastStep: boolean;
  goNext: () => Promise<void>;
  goBack: () => void;
  goToStep: (index: number) => void;
};

type UseStepperProps<T> = {
  /** Array con la configuración de cada paso y sus campos. */
  steps: StepConfig<T>[];
  /** Callback que recibe los campos a validar y retorna un booleano */
  triggerValidation: (fields: (keyof T)[]) => Promise<boolean>;
};

/**
 * Hook genérico para manejar la navegación y validación de formularios por pasos (Wizards).
 * Está desacoplado de librerías de formularios, solo requiere una función inyectada para validar.
 * * PARA LA UI (Prevención de bugs de envío):
 * Para evitar que el formulario se envíe accidentalmente al cambiar de paso:
 * * 1. `type="button"`: Los botones de "Atrás" y "Siguiente" DEBEN tener esta prop explícita.
 * 2. `key` único: Si usas un renderizado condicional (ternario) para cambiar entre el botón
 * "Siguiente" y "Enviar", debes ponerles un `key` distinto (ej. `key="btn-next"` y `key="btn-submit"`).
 * Esto fuerza a React a destruir el nodo DOM en lugar de reciclarlo.
 * 3. `onKeyDown`: Considera bloquear la tecla 'Enter' en el `<form>` si tus inputs no son textareas.
 * * @template T - Tipo inferido de los valores del formulario (ej. z.infer<typeof schema>)
 * @param {StepConfig<T>[]} steps - Array con la configuración de cada paso y sus campos.
 * @param {(fields: (keyof T)[]) => Promise<boolean>} triggerValidation - Callback de validación (ej. `form.trigger` de React Hook Form).
 * * @example
 * // Implementación segura en el JSX:
 * {!isLastStep ? (
 * <button key="btn-next" type="button" onClick={goNext}> Siguiente </button>
 * ) : (
 * <button key="btn-submit" type="submit"> Enviar </button>
 * )}
 */
export function useStepper<T>({ steps, triggerValidation }: UseStepperProps<T>): UseStepper<T> {
  const [stepIndex, setStepIndex] = useState(0);

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  async function goNext() {
    if (isLastStep) return;

    // Ejecutamos validación (el form.trigger que pasa por prop)
    const currentFields = steps[stepIndex].fields;
    const isValid = await triggerValidation(currentFields);

    if (isValid) {
      setStepIndex((prev) => prev + 1);
    }
  }

  function goBack() {
    if (!isFirstStep) {
      setStepIndex((prev) => prev - 1);
    }
  }

  function goToStep(index: number) {
    if (index >= 0 && index < steps.length) {
      setStepIndex(index);
    }
  }

  return {
    stepIndex,
    currentStep: steps[stepIndex],
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
    goToStep,
  };
}
