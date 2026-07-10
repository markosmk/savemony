import type { SavingsMethodInfo } from "@/types/app";

export const SAVINGS_METHODS: SavingsMethodInfo[] = [
  {
    id: "custom_grid",
    name: "Grilla Libre",
    description: "Celdas con montos variables, tú marcas cuando ahorras",
    defaultRows: 6,
    defaultCols: 7,
    idealFor: "Objetivos específicos",
  },
  {
    id: "52_weeks",
    name: "52 Semanas",
    description: "$1 semana 1, $2 semana 2... hasta $52",
    defaultRows: 4,
    defaultCols: 13,
    typicalTotal: 1378,
    idealFor: "Hábito anual",
  },
  {
    id: "100_envelopes",
    name: "100 Sobres",
    description: "Números 1-100, eliges uno al azar por día",
    defaultRows: 10,
    defaultCols: 10,
    typicalTotal: 5050,
    idealFor: "Desafío intenso",
  },
  {
    id: "3_months",
    name: "3 Meses",
    description: "Ahorra un monto cada dia durante 3 meses",
    defaultRows: 6,
    defaultCols: 15,
    idealFor: "Ahorro diario",
  },
  {
    id: "no_spend",
    name: "No-Spend Tracker",
    description: "Días sin gastos → equivalencia a ahorro",
    defaultRows: 5,
    defaultCols: 7,
    idealFor: "Reducir gastos",
  },
];
