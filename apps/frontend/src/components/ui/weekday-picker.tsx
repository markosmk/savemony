import { Toggle } from "./toggle";

interface WeekdayPickerProps {
  /** Array de numeros [1, 3, 5] */
  value?: number[];
  onChange?: (value: number[]) => void;
}

const DAYS = [
  { value: 1, label: "Lun", fullName: "Lunes" },
  { value: 2, label: "Mar", fullName: "Martes" },
  { value: 3, label: "Mié", fullName: "Miércoles" },
  { value: 4, label: "Jue", fullName: "Jueves" },
  { value: 5, label: "Vie", fullName: "Viernes" },
  { value: 6, label: "Sáb", fullName: "Sábado" },
  { value: 0, label: "Dom", fullName: "Domingo" },
];

export function WeekdayPicker({ value = [], onChange }: WeekdayPickerProps) {
  const handleToggle = (dayValue: number, pressed: boolean) => {
    if (!onChange) return;

    if (pressed) {
      // Agregamos el día y lo ordenamos para que siempre quede [1, 2, 3...]
      onChange([...value, dayValue].sort((a, b) => a - b));
    } else {
      // Quitamos el día
      onChange(value.filter((v) => v !== dayValue));
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {DAYS.map((day) => {
        const isPressed = value.includes(day.value);
        return (
          <Toggle
            key={day.value}
            pressed={isPressed}
            onPressedChange={(pressed) => {
              handleToggle(day.value, pressed);
            }}
            className="h-10 w-14 p-0 rounded-full font-medium transition-all bg-muted active:scale-95 data-[state=on]:bg-primary"
            title={day.fullName}
          >
            {day.label}
          </Toggle>
        );
      })}
    </div>
  );
}
