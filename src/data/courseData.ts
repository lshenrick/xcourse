export interface Lesson {
  id: string;
  title: string;
  duration?: string;
  type?: "video" | "ebook";
}

export interface Module {
  id: string;
  title: string;
  emoji: string;
  lessons: Lesson[];
}

export const courseModules: Module[] = [
  {
    id: "intro",
    emoji: "📖",
    title: "Introdução",
    lessons: [
      { id: "intro-1", title: "Boas-vindas ao curso" },
    ],
  },
  {
    id: "semana-1",
    emoji: "🧠",
    title: "Semana 1 - PILAR MENTAL",
    lessons: [
      { id: "s1-d1", title: "Dia 1: Por que você se tornou essa pessoa?" },
      { id: "s1-d2", title: "Dia 2: O piloto automático" },
      { id: "s1-d3", title: "Dia 3: Os pensamentos não são a sua identidade" },
      { id: "s1-d4", title: "Dia 4: Hábitos invisíveis" },
      { id: "s1-d5", title: "Dia 5: O diálogo interno" },
      { id: "s1-d6", title: "Dia 6: A influência do ambiente" },
      { id: "s1-d7", title: "Dia 7: Observar sem julgar" },
    ],
  },
  {
    id: "semana-2",
    emoji: "🧍",
    title: "Semana 2 - PILAR FÍSICO",
    lessons: [
      { id: "s2-d8", title: "Dia 8: O corpo guarda a sua história" },
      { id: "s2-d9", title: "Dia 9: Desacelerar antes de mudar" },
      { id: "s2-d10", title: "Dia 10: Respiração e presença" },
      { id: "s2-d11", title: "Dia 11: Micro pausas conscientes" },
      { id: "s2-d12", title: "Dia 12: O cansaço não é fraqueza" },
      { id: "s2-d13", title: "Dia 13: Silenciar os estímulos" },
      { id: "s2-d14", title: "Dia 14: Um novo ritmo de vida" },
    ],
  },
  {
    id: "semana-3",
    emoji: "💚",
    title: "Semana 3 - PILAR EMOCIONAL",
    lessons: [
      { id: "s3-d15", title: "Dia 15: A emoção não é um comando" },
      { id: "s3-d16", title: "Dia 16: Irritação e impulsos" },
      { id: "s3-d17", title: "Dia 17: Culpa e autoexigência" },
      { id: "s3-d18", title: "Dia 18: Medo e controle" },
      { id: "s3-d19", title: "Dia 19: Frustração e expectativas" },
      { id: "s3-d20", title: "Dia 20: Responder em vez de reagir" },
      { id: "s3-d21", title: "Dia 21: Estabilidade emocional" },
    ],
  },
  {
    id: "semana-4",
    emoji: "✨",
    title: "Semana 4 - PILAR INTERIOR",
    lessons: [
      { id: "s4-d22", title: "Dia 22: Quem você está se tornando" },
      { id: "s4-d23", title: "Dia 23: Simplificar a vida" },
      { id: "s4-d24", title: "Dia 24: Proteger a mente" },
      { id: "s4-d25", title: "Dia 25: Criar uma rotina sustentável" },
      { id: "s4-d26", title: "Dia 26: Lidar com as recaídas" },
      { id: "s4-d27", title: "Dia 27: Ajustar o caminho" },
      { id: "s4-d28", title: "Dia 28: Permanecer presente" },
      { id: "s4-d29", title: "Dia 29: Manter o novo padrão" },
      { id: "s4-d30", title: "Dia 30: Encerramento e continuidade" },
    ],
  },
  {
    id: "bonus-1",
    emoji: "🎁",
    title: "BÔNUS 1 | Bebidas Naturais para Digestão Lenta e Abdômen Inchado",
    lessons: [
      { id: "b1-1", title: "Bebidas Naturais para Digestão Lenta e Abdômen Inchado", type: "ebook" },
    ],
  },
  {
    id: "bonus-2",
    emoji: "🎁",
    title: "BÔNUS 2 | Plantas e Bebidas para Melhorar o Sono Naturalmente",
    lessons: [
      { id: "b2-1", title: "Plantas e Bebidas para Melhorar o Sono Naturalmente", type: "ebook" },
    ],
  },
  {
    id: "bonus-3",
    emoji: "🎁",
    title: "BÔNUS 3 | Como Eliminar Pensamentos Repetitivos e Parar de Pensar Demais",
    lessons: [
      { id: "b3-1", title: "Por que a mente repete pensamentos e o erro de tentar controlá-los" },
      { id: "b3-2", title: "Como interromper o ciclo na prática" },
      { id: "b3-3", title: "O que fazer quando a repetição volta e como evitar cair no mesmo ciclo" },
    ],
  },
];
