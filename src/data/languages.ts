import type { Module } from "./courseData";

export type LanguageCode = "pt" | "en" | "es" | "de" | "fr" | "it";

export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  flag: string;
  slug: string;
  courseName: string;
  accessButton: string;
}

export interface UITranslations {
  memberArea: string;
  enterEmail: string;
  emailPlaceholder: string;
  enterPassword: string;
  passwordPlaceholder: string;
  enter: string;
  signUp: string;
  noAccount: string;
  hasAccount: string;
  supportText: string;
  supportLabel: string;
  previousLesson: string;
  nextLesson: string;
  ebookTitle: string;
  ebookDescription: string;
  downloadEbook: string;
  courseContent: string;
  menu: string;
  viewCourseContent: string;
  moduleLabel: string;
  lessonsLabel: string;
  ebookContentLabel: string;
  videoPlaceholder: string;
  emailRequired: string;
  yourRating: string;
  markComplete: string;
  markIncomplete: string;
  completed: string;
  addComment: string;
  commentPlaceholder: string;
  sendComment: string;
  reply: string;
  replyPlaceholder: string;
  sendReply: string;
  like: string;
  comments: string;
  logout: string;
  editComment: string;
  deleteComment: string;
  confirmDelete: string;
  cancelAction: string;
  saveEdit: string;
  enterName: string;
  namePlaceholder: string;
  enterDisplayName: string;
  displayNamePlaceholder: string;
  saveDisplayName: string;
}

export const languages: LanguageConfig[] = [
  { code: "pt", name: "Português", flag: "🇧🇷", slug: "acesso", courseName: "Jornada de Evolução de 30 Dias", accessButton: "Acessar Curso" },
  { code: "en", name: "English", flag: "🇺🇸", slug: "access", courseName: "30-Day Evolution Journey", accessButton: "Access Course" },
  { code: "es", name: "Español", flag: "🇪🇸", slug: "acceso", courseName: "Jornada de Evolución de 30 Días", accessButton: "Acceder al Curso" },
  { code: "de", name: "Deutsch", flag: "🇩🇪", slug: "zugang", courseName: "30-Tage-Reise der Entwicklung", accessButton: "Kurs Zugreifen" },
  { code: "fr", name: "Français", flag: "🇫🇷", slug: "acces", courseName: "Parcours d'Évolution de 30 Jours", accessButton: "Accéder au Cours" },
  { code: "it", name: "Italiano", flag: "🇮🇹", slug: "accesso", courseName: "Percorso di Evoluzione di 30 Giorni", accessButton: "Accedi al Corso" },
];

export const uiTranslations: Record<LanguageCode, UITranslations> = {
  pt: {
    memberArea: "Área de Membros",
    enterEmail: "Digite o e-mail usado na compra",
    emailPlaceholder: "seuemail@exemplo.com",
    enterPassword: "Digite sua senha",
    passwordPlaceholder: "Sua senha",
    enter: "Entrar",
    signUp: "Criar conta",
    noAccount: "Não tem conta?",
    hasAccount: "Já tem conta?",
    supportText: "Precisa de suporte?",
    supportLabel: "contact@everwynventures.com",
    previousLesson: "Aula anterior",
    nextLesson: "Próxima aula",
    ebookTitle: "📖 Este conteúdo é um E-book",
    ebookDescription: "Clique no botão abaixo para baixar o PDF e ler no seu dispositivo.",
    downloadEbook: "Baixar E-book (PDF)",
    courseContent: "Conteúdo do Curso",
    menu: "Menu",
    viewCourseContent: "📚 Ver Conteúdo do Curso",
    moduleLabel: "Módulo",
    lessonsLabel: "aulas",
    ebookContentLabel: "Este conteúdo é um E-book",
    videoPlaceholder: "Insira o código do vídeo aqui",
    emailRequired: "Preencha este campo",
    yourRating: "Sua avaliação:",
    markComplete: "Marcar como concluída",
    markIncomplete: "Desmarcar conclusão",
    completed: "Concluída",
    addComment: "Comentários",
    commentPlaceholder: "Escreva seu comentário...",
    sendComment: "Enviar",
    reply: "Responder",
    replyPlaceholder: "Escreva sua resposta...",
    sendReply: "Enviar resposta",
    like: "Curtir",
    comments: "Comentários",
    logout: "Sair",
    editComment: "Editar",
    deleteComment: "Apagar",
    confirmDelete: "Tem certeza?",
    cancelAction: "Cancelar",
    saveEdit: "Salvar",
    enterName: "Digite seu nome",
    namePlaceholder: "Seu nome completo",
    enterDisplayName: "Antes de comentar, escolha um nome de exibição:",
    displayNamePlaceholder: "Seu nome...",
    saveDisplayName: "Salvar nome",
  },
  en: {
    memberArea: "Member Area",
    enterEmail: "Enter the email used for purchase",
    emailPlaceholder: "youremail@example.com",
    enterPassword: "Enter your password",
    passwordPlaceholder: "Your password",
    enter: "Sign In",
    signUp: "Sign Up",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    supportText: "Need support?",
    supportLabel: "contact@everwynventures.com",
    previousLesson: "Previous lesson",
    nextLesson: "Next lesson",
    ebookTitle: "📖 This content is an E-book",
    ebookDescription: "Click the button below to download the PDF and read on your device.",
    downloadEbook: "Download E-book (PDF)",
    courseContent: "Course Content",
    menu: "Menu",
    viewCourseContent: "📚 View Course Content",
    moduleLabel: "Module",
    lessonsLabel: "lessons",
    ebookContentLabel: "This content is an E-book",
    videoPlaceholder: "Insert video code here",
    emailRequired: "Please fill out this field",
    yourRating: "Your rating:",
    markComplete: "Mark as complete",
    markIncomplete: "Unmark completion",
    completed: "Completed",
    addComment: "Comments",
    commentPlaceholder: "Write your comment...",
    sendComment: "Send",
    reply: "Reply",
    replyPlaceholder: "Write your reply...",
    sendReply: "Send reply",
    like: "Like",
    comments: "Comments",
    logout: "Logout",
    editComment: "Edit",
    deleteComment: "Delete",
    confirmDelete: "Are you sure?",
    cancelAction: "Cancel",
    saveEdit: "Save",
    enterName: "Enter your name",
    namePlaceholder: "Your full name",
    enterDisplayName: "Before commenting, choose a display name:",
    displayNamePlaceholder: "Your name...",
    saveDisplayName: "Save name",
  },
  es: {
    memberArea: "Área de Miembros",
    enterEmail: "Ingresa el correo usado en la compra",
    emailPlaceholder: "tucorreo@ejemplo.com",
    enterPassword: "Ingresa tu contraseña",
    passwordPlaceholder: "Tu contraseña",
    enter: "Entrar",
    signUp: "Crear cuenta",
    noAccount: "¿No tienes cuenta?",
    hasAccount: "¿Ya tienes cuenta?",
    supportText: "¿Necesitas soporte?",
    supportLabel: "contact@everwynventures.com",
    previousLesson: "Lección anterior",
    nextLesson: "Próxima lección",
    ebookTitle: "📖 Este contenido es un E-book",
    ebookDescription: "Haz clic en el botón de abajo para descargar el PDF y leerlo en tu dispositivo.",
    downloadEbook: "Descargar E-book (PDF)",
    courseContent: "Contenido del Curso",
    menu: "Menú",
    viewCourseContent: "📚 Ver Contenido del Curso",
    moduleLabel: "Módulo",
    lessonsLabel: "lecciones",
    ebookContentLabel: "Este contenido es un E-book",
    videoPlaceholder: "Inserta el código del video aquí",
    emailRequired: "Rellena este campo",
    yourRating: "Tu valoración:",
    markComplete: "Marcar como completada",
    markIncomplete: "Desmarcar finalización",
    completed: "Completada",
    addComment: "Comentarios",
    commentPlaceholder: "Escribe tu comentario...",
    sendComment: "Enviar",
    reply: "Responder",
    replyPlaceholder: "Escribe tu respuesta...",
    sendReply: "Enviar respuesta",
    like: "Me gusta",
    comments: "Comentarios",
    logout: "Salir",
    editComment: "Editar",
    deleteComment: "Eliminar",
    confirmDelete: "¿Estás seguro?",
    cancelAction: "Cancelar",
    saveEdit: "Guardar",
    enterName: "Ingresa tu nombre",
    namePlaceholder: "Tu nombre completo",
    enterDisplayName: "Antes de comentar, elige un nombre para mostrar:",
    displayNamePlaceholder: "Tu nombre...",
    saveDisplayName: "Guardar nombre",
  },
  de: {
    memberArea: "Mitgliederbereich",
    enterEmail: "Gib die beim Kauf verwendete E-Mail ein",
    emailPlaceholder: "deineemail@beispiel.com",
    enterPassword: "Gib dein Passwort ein",
    passwordPlaceholder: "Dein Passwort",
    enter: "Eintreten",
    signUp: "Registrieren",
    noAccount: "Kein Konto?",
    hasAccount: "Bereits ein Konto?",
    supportText: "Brauchst du Hilfe?",
    supportLabel: "contact@everwynventures.com",
    previousLesson: "Vorherige Lektion",
    nextLesson: "Nächste Lektion",
    ebookTitle: "📖 Dieser Inhalt ist ein E-Book",
    ebookDescription: "Klicke auf den Button unten, um das PDF herunterzuladen und auf deinem Gerät zu lesen.",
    downloadEbook: "E-Book herunterladen (PDF)",
    courseContent: "Kursinhalt",
    menu: "Menü",
    viewCourseContent: "📚 Kursinhalt anzeigen",
    moduleLabel: "Modul",
    lessonsLabel: "Lektionen",
    ebookContentLabel: "Dieser Inhalt ist ein E-Book",
    videoPlaceholder: "Videocode hier einfügen",
    emailRequired: "Bitte füllen Sie dieses Feld aus",
    yourRating: "Ihre Bewertung:",
    markComplete: "Als abgeschlossen markieren",
    markIncomplete: "Abschluss aufheben",
    completed: "Abgeschlossen",
    addComment: "Kommentare",
    commentPlaceholder: "Schreibe deinen Kommentar...",
    sendComment: "Senden",
    reply: "Antworten",
    replyPlaceholder: "Schreibe deine Antwort...",
    sendReply: "Antwort senden",
    like: "Gefällt mir",
    comments: "Kommentare",
    logout: "Abmelden",
    editComment: "Bearbeiten",
    deleteComment: "Löschen",
    confirmDelete: "Bist du sicher?",
    cancelAction: "Abbrechen",
    saveEdit: "Speichern",
    enterName: "Gib deinen Namen ein",
    namePlaceholder: "Dein vollständiger Name",
    enterDisplayName: "Bevor du kommentierst, wähle einen Anzeigenamen:",
    displayNamePlaceholder: "Dein Name...",
    saveDisplayName: "Name speichern",
  },
  fr: {
    memberArea: "Espace Membre",
    enterEmail: "Entrez l'e-mail utilisé lors de l'achat",
    emailPlaceholder: "votreemail@exemple.com",
    enterPassword: "Entrez votre mot de passe",
    passwordPlaceholder: "Votre mot de passe",
    enter: "Se connecter",
    signUp: "S'inscrire",
    noAccount: "Pas de compte ?",
    hasAccount: "Déjà un compte ?",
    supportText: "Besoin d'aide ?",
    supportLabel: "contact@everwynventures.com",
    previousLesson: "Leçon précédente",
    nextLesson: "Leçon suivante",
    ebookTitle: "📖 Ce contenu est un E-book",
    ebookDescription: "Cliquez sur le bouton ci-dessous pour télécharger le PDF et le lire sur votre appareil.",
    downloadEbook: "Télécharger l'E-book (PDF)",
    courseContent: "Contenu du Cours",
    menu: "Menu",
    viewCourseContent: "📚 Voir le Contenu du Cours",
    moduleLabel: "Module",
    lessonsLabel: "leçons",
    ebookContentLabel: "Ce contenu est un E-book",
    videoPlaceholder: "Insérez le code vidéo ici",
    emailRequired: "Veuillez remplir ce champ",
    yourRating: "Votre note :",
    markComplete: "Marquer comme terminée",
    markIncomplete: "Annuler la complétion",
    completed: "Terminée",
    addComment: "Commentaires",
    commentPlaceholder: "Écrivez votre commentaire...",
    sendComment: "Envoyer",
    reply: "Répondre",
    replyPlaceholder: "Écrivez votre réponse...",
    sendReply: "Envoyer la réponse",
    like: "J'aime",
    comments: "Commentaires",
    logout: "Déconnexion",
    editComment: "Modifier",
    deleteComment: "Supprimer",
    confirmDelete: "Êtes-vous sûr ?",
    cancelAction: "Annuler",
    saveEdit: "Enregistrer",
    enterName: "Entrez votre nom",
    namePlaceholder: "Votre nom complet",
    enterDisplayName: "Avant de commenter, choisissez un nom d'affichage :",
    displayNamePlaceholder: "Votre nom...",
    saveDisplayName: "Enregistrer le nom",
  },
  it: {
    memberArea: "Area Membri",
    enterEmail: "Inserisci l'email usata per l'acquisto",
    emailPlaceholder: "tuaemail@esempio.com",
    enterPassword: "Inserisci la tua password",
    passwordPlaceholder: "La tua password",
    enter: "Accedi",
    signUp: "Registrati",
    noAccount: "Non hai un account?",
    hasAccount: "Hai già un account?",
    supportText: "Hai bisogno di supporto?",
    supportLabel: "contact@everwynventures.com",
    previousLesson: "Lezione precedente",
    nextLesson: "Prossima lezione",
    ebookTitle: "📖 Questo contenuto è un E-book",
    ebookDescription: "Clicca il pulsante qui sotto per scaricare il PDF e leggerlo sul tuo dispositivo.",
    downloadEbook: "Scarica E-book (PDF)",
    courseContent: "Contenuto del Corso",
    menu: "Menu",
    viewCourseContent: "📚 Vedi Contenuto del Corso",
    moduleLabel: "Modulo",
    lessonsLabel: "lezioni",
    ebookContentLabel: "Questo contenuto è un E-book",
    videoPlaceholder: "Inserisci il codice video qui",
    emailRequired: "Compila questo campo",
    yourRating: "La tua valutazione:",
    markComplete: "Segna come completata",
    markIncomplete: "Annulla completamento",
    completed: "Completata",
    addComment: "Commenti",
    commentPlaceholder: "Scrivi il tuo commento...",
    sendComment: "Invia",
    reply: "Rispondi",
    replyPlaceholder: "Scrivi la tua risposta...",
    sendReply: "Invia risposta",
    like: "Mi piace",
    comments: "Commenti",
    logout: "Esci",
    editComment: "Modifica",
    deleteComment: "Elimina",
    confirmDelete: "Sei sicuro?",
    cancelAction: "Annulla",
    saveEdit: "Salva",
    enterName: "Inserisci il tuo nome",
    namePlaceholder: "Il tuo nome completo",
    enterDisplayName: "Prima di commentare, scegli un nome visualizzato:",
    displayNamePlaceholder: "Il tuo nome...",
    saveDisplayName: "Salva nome",
  },
};

export function getLanguageBySlug(slug: string): LanguageConfig | undefined {
  return languages.find((l) => l.slug === slug);
}

export function getLanguageByCode(code: LanguageCode): LanguageConfig {
  return languages.find((l) => l.code === code)!;
}

// Course modules per language
export const courseModulesByLang: Record<LanguageCode, Module[]> = {
  pt: [
    {
      id: "intro", emoji: "📖", title: "Introdução",
      lessons: [{ id: "intro-1", title: "Boas-vindas ao curso" }],
    },
    {
      id: "semana-1", emoji: "🧠", title: "Semana 1 - PILAR MENTAL",
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
      id: "semana-2", emoji: "🧍", title: "Semana 2 - PILAR FÍSICO",
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
      id: "semana-3", emoji: "💚", title: "Semana 3 - PILAR EMOCIONAL",
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
      id: "semana-4", emoji: "✨", title: "Semana 4 - PILAR INTERIOR",
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
      id: "bonus-1", emoji: "🎁", title: "BÔNUS 1 | Bebidas Naturais para Digestão Lenta e Abdômen Inchado",
      lessons: [{ id: "b1-1", title: "Bebidas Naturais para Digestão Lenta e Abdômen Inchado", type: "ebook" as const }],
    },
    {
      id: "bonus-2", emoji: "🎁", title: "BÔNUS 2 | Plantas e Bebidas para Melhorar o Sono Naturalmente",
      lessons: [{ id: "b2-1", title: "Plantas e Bebidas para Melhorar o Sono Naturalmente", type: "ebook" as const }],
    },
    {
      id: "bonus-3", emoji: "🎁", title: "BÔNUS 3 | Como Eliminar Pensamentos Repetitivos e Parar de Pensar Demais",
      lessons: [
        { id: "b3-1", title: "Por que a mente repete pensamentos e o erro de tentar controlá-los" },
        { id: "b3-2", title: "Como interromper o ciclo na prática" },
        { id: "b3-3", title: "O que fazer quando a repetição volta e como evitar cair no mesmo ciclo" },
      ],
    },
  ],
  en: [
    {
      id: "intro", emoji: "📖", title: "Introduction",
      lessons: [{ id: "intro-1", title: "Welcome to the course" }],
    },
    {
      id: "semana-1", emoji: "🧠", title: "Week 1 - MENTAL PILLAR",
      lessons: [
        { id: "s1-d1", title: "Day 1: Why did you become this person?" },
        { id: "s1-d2", title: "Day 2: The autopilot" },
        { id: "s1-d3", title: "Day 3: Thoughts are not your identity" },
        { id: "s1-d4", title: "Day 4: Invisible habits" },
        { id: "s1-d5", title: "Day 5: The inner dialogue" },
        { id: "s1-d6", title: "Day 6: The influence of environment" },
        { id: "s1-d7", title: "Day 7: Observe without judging" },
      ],
    },
    {
      id: "semana-2", emoji: "🧍", title: "Week 2 - PHYSICAL PILLAR",
      lessons: [
        { id: "s2-d8", title: "Day 8: The body stores your history" },
        { id: "s2-d9", title: "Day 9: Slow down before changing" },
        { id: "s2-d10", title: "Day 10: Breathing and presence" },
        { id: "s2-d11", title: "Day 11: Conscious micro pauses" },
        { id: "s2-d12", title: "Day 12: Tiredness is not weakness" },
        { id: "s2-d13", title: "Day 13: Silencing the stimuli" },
        { id: "s2-d14", title: "Day 14: A new pace of life" },
      ],
    },
    {
      id: "semana-3", emoji: "💚", title: "Week 3 - EMOTIONAL PILLAR",
      lessons: [
        { id: "s3-d15", title: "Day 15: Emotion is not a command" },
        { id: "s3-d16", title: "Day 16: Irritation and impulses" },
        { id: "s3-d17", title: "Day 17: Guilt and self-demand" },
        { id: "s3-d18", title: "Day 18: Fear and control" },
        { id: "s3-d19", title: "Day 19: Frustration and expectations" },
        { id: "s3-d20", title: "Day 20: Respond instead of react" },
        { id: "s3-d21", title: "Day 21: Emotional stability" },
      ],
    },
    {
      id: "semana-4", emoji: "✨", title: "Week 4 - INNER PILLAR",
      lessons: [
        { id: "s4-d22", title: "Day 22: Who you are becoming" },
        { id: "s4-d23", title: "Day 23: Simplify life" },
        { id: "s4-d24", title: "Day 24: Protect your mind" },
        { id: "s4-d25", title: "Day 25: Create a sustainable routine" },
        { id: "s4-d26", title: "Day 26: Dealing with relapses" },
        { id: "s4-d27", title: "Day 27: Adjust the path" },
        { id: "s4-d28", title: "Day 28: Stay present" },
        { id: "s4-d29", title: "Day 29: Maintain the new pattern" },
        { id: "s4-d30", title: "Day 30: Closing and continuity" },
      ],
    },
    {
      id: "bonus-1", emoji: "🎁", title: "BONUS 1 | Natural Drinks for Slow Digestion and Bloated Abdomen",
      lessons: [{ id: "b1-1", title: "Natural Drinks for Slow Digestion and Bloated Abdomen", type: "ebook" as const }],
    },
    {
      id: "bonus-2", emoji: "🎁", title: "BONUS 2 | Plants and Drinks to Improve Sleep Naturally",
      lessons: [{ id: "b2-1", title: "Plants and Drinks to Improve Sleep Naturally", type: "ebook" as const }],
    },
    {
      id: "bonus-3", emoji: "🎁", title: "BONUS 3 | How to Eliminate Repetitive Thoughts and Stop Overthinking",
      lessons: [
        { id: "b3-1", title: "Why the mind repeats thoughts and the mistake of trying to control them" },
        { id: "b3-2", title: "How to break the cycle in practice" },
        { id: "b3-3", title: "What to do when repetition returns and how to avoid falling into the same cycle" },
      ],
    },
  ],
  es: [
    {
      id: "intro", emoji: "📖", title: "Introducción",
      lessons: [{ id: "intro-1", title: "Bienvenida al curso" }],
    },
    {
      id: "semana-1", emoji: "🧠", title: "Semana 1 - PILAR MENTAL",
      lessons: [
        { id: "s1-d1", title: "Día 1: ¿Por qué te convertiste en esta persona?" },
        { id: "s1-d2", title: "Día 2: El piloto automático" },
        { id: "s1-d3", title: "Día 3: Los pensamientos no son tu identidad" },
        { id: "s1-d4", title: "Día 4: Hábitos invisibles" },
        { id: "s1-d5", title: "Día 5: El diálogo interno" },
        { id: "s1-d6", title: "Día 6: La influencia del entorno" },
        { id: "s1-d7", title: "Día 7: Observar sin juzgar" },
      ],
    },
    {
      id: "semana-2", emoji: "🧍", title: "Semana 2 - PILAR FÍSICO",
      lessons: [
        { id: "s2-d8", title: "Día 8: El cuerpo guarda tu historia" },
        { id: "s2-d9", title: "Día 9: Desacelerar antes de cambiar" },
        { id: "s2-d10", title: "Día 10: Respiración y presencia" },
        { id: "s2-d11", title: "Día 11: Micro pausas conscientes" },
        { id: "s2-d12", title: "Día 12: El cansancio no es debilidad" },
        { id: "s2-d13", title: "Día 13: Silenciar los estímulos" },
        { id: "s2-d14", title: "Día 14: Un nuevo ritmo de vida" },
      ],
    },
    {
      id: "semana-3", emoji: "💚", title: "Semana 3 - PILAR EMOCIONAL",
      lessons: [
        { id: "s3-d15", title: "Día 15: La emoción no es un comando" },
        { id: "s3-d16", title: "Día 16: Irritación e impulsos" },
        { id: "s3-d17", title: "Día 17: Culpa y autoexigencia" },
        { id: "s3-d18", title: "Día 18: Miedo y control" },
        { id: "s3-d19", title: "Día 19: Frustración y expectativas" },
        { id: "s3-d20", title: "Día 20: Responder en vez de reaccionar" },
        { id: "s3-d21", title: "Día 21: Estabilidad emocional" },
      ],
    },
    {
      id: "semana-4", emoji: "✨", title: "Semana 4 - PILAR INTERIOR",
      lessons: [
        { id: "s4-d22", title: "Día 22: En quién te estás convirtiendo" },
        { id: "s4-d23", title: "Día 23: Simplificar la vida" },
        { id: "s4-d24", title: "Día 24: Proteger la mente" },
        { id: "s4-d25", title: "Día 25: Crear una rutina sostenible" },
        { id: "s4-d26", title: "Día 26: Lidiar con las recaídas" },
        { id: "s4-d27", title: "Día 27: Ajustar el camino" },
        { id: "s4-d28", title: "Día 28: Permanecer presente" },
        { id: "s4-d29", title: "Día 29: Mantener el nuevo patrón" },
        { id: "s4-d30", title: "Día 30: Cierre y continuidad" },
      ],
    },
    {
      id: "bonus-1", emoji: "🎁", title: "BONO 1 | Bebidas Naturales para Digestión Lenta y Abdomen Hinchado",
      lessons: [{ id: "b1-1", title: "Bebidas Naturales para Digestión Lenta y Abdomen Hinchado", type: "ebook" as const }],
    },
    {
      id: "bonus-2", emoji: "🎁", title: "BONO 2 | Plantas y Bebidas para Mejorar el Sueño Naturalmente",
      lessons: [{ id: "b2-1", title: "Plantas y Bebidas para Mejorar el Sueño Naturalmente", type: "ebook" as const }],
    },
    {
      id: "bonus-3", emoji: "🎁", title: "BONO 3 | Cómo Eliminar Pensamientos Repetitivos y Dejar de Pensar Demasiado",
      lessons: [
        { id: "b3-1", title: "Por qué la mente repite pensamientos y el error de intentar controlarlos" },
        { id: "b3-2", title: "Cómo interrumpir el ciclo en la práctica" },
        { id: "b3-3", title: "Qué hacer cuando la repetición vuelve y cómo evitar caer en el mismo ciclo" },
      ],
    },
  ],
  de: [
    {
      id: "intro", emoji: "📖", title: "Einführung",
      lessons: [{ id: "intro-1", title: "Willkommen zum Kurs" }],
    },
    {
      id: "semana-1", emoji: "🧠", title: "Woche 1 - MENTALE SÄULE",
      lessons: [
        { id: "s1-d1", title: "Tag 1: Warum bist du zu dieser Person geworden?" },
        { id: "s1-d2", title: "Tag 2: Der Autopilot" },
        { id: "s1-d3", title: "Tag 3: Gedanken sind nicht deine Identität" },
        { id: "s1-d4", title: "Tag 4: Unsichtbare Gewohnheiten" },
        { id: "s1-d5", title: "Tag 5: Der innere Dialog" },
        { id: "s1-d6", title: "Tag 6: Der Einfluss der Umgebung" },
        { id: "s1-d7", title: "Tag 7: Beobachten ohne zu urteilen" },
      ],
    },
    {
      id: "semana-2", emoji: "🧍", title: "Woche 2 - KÖRPERLICHE SÄULE",
      lessons: [
        { id: "s2-d8", title: "Tag 8: Der Körper speichert deine Geschichte" },
        { id: "s2-d9", title: "Tag 9: Verlangsamen bevor du dich änderst" },
        { id: "s2-d10", title: "Tag 10: Atmung und Präsenz" },
        { id: "s2-d11", title: "Tag 11: Bewusste Mikropausen" },
        { id: "s2-d12", title: "Tag 12: Müdigkeit ist keine Schwäche" },
        { id: "s2-d13", title: "Tag 13: Die Reize stillen" },
        { id: "s2-d14", title: "Tag 14: Ein neuer Lebensrhythmus" },
      ],
    },
    {
      id: "semana-3", emoji: "💚", title: "Woche 3 - EMOTIONALE SÄULE",
      lessons: [
        { id: "s3-d15", title: "Tag 15: Emotion ist kein Befehl" },
        { id: "s3-d16", title: "Tag 16: Reizbarkeit und Impulse" },
        { id: "s3-d17", title: "Tag 17: Schuld und Selbstanforderung" },
        { id: "s3-d18", title: "Tag 18: Angst und Kontrolle" },
        { id: "s3-d19", title: "Tag 19: Frustration und Erwartungen" },
        { id: "s3-d20", title: "Tag 20: Antworten statt reagieren" },
        { id: "s3-d21", title: "Tag 21: Emotionale Stabilität" },
      ],
    },
    {
      id: "semana-4", emoji: "✨", title: "Woche 4 - INNERE SÄULE",
      lessons: [
        { id: "s4-d22", title: "Tag 22: Wer du wirst" },
        { id: "s4-d23", title: "Tag 23: Das Leben vereinfachen" },
        { id: "s4-d24", title: "Tag 24: Den Geist schützen" },
        { id: "s4-d25", title: "Tag 25: Eine nachhaltige Routine schaffen" },
        { id: "s4-d26", title: "Tag 26: Mit Rückfällen umgehen" },
        { id: "s4-d27", title: "Tag 27: Den Weg anpassen" },
        { id: "s4-d28", title: "Tag 28: Präsent bleiben" },
        { id: "s4-d29", title: "Tag 29: Das neue Muster beibehalten" },
        { id: "s4-d30", title: "Tag 30: Abschluss und Fortführung" },
      ],
    },
    {
      id: "bonus-1", emoji: "🎁", title: "BONUS 1 | Natürliche Getränke bei langsamer Verdauung und aufgeblähtem Bauch",
      lessons: [{ id: "b1-1", title: "Natürliche Getränke bei langsamer Verdauung und aufgeblähtem Bauch", type: "ebook" as const }],
    },
    {
      id: "bonus-2", emoji: "🎁", title: "BONUS 2 | Pflanzen und Getränke zur natürlichen Verbesserung des Schlafs",
      lessons: [{ id: "b2-1", title: "Pflanzen und Getränke zur natürlichen Verbesserung des Schlafs", type: "ebook" as const }],
    },
    {
      id: "bonus-3", emoji: "🎁", title: "BONUS 3 | Wie man wiederkehrende Gedanken eliminiert und aufhört zu viel zu denken",
      lessons: [
        { id: "b3-1", title: "Warum der Geist Gedanken wiederholt und der Fehler sie kontrollieren zu wollen" },
        { id: "b3-2", title: "Wie man den Kreislauf in der Praxis durchbricht" },
        { id: "b3-3", title: "Was tun wenn die Wiederholung zurückkehrt und wie man vermeidet in denselben Kreislauf zu fallen" },
      ],
    },
  ],
  fr: [
    {
      id: "intro", emoji: "📖", title: "Introduction",
      lessons: [{ id: "intro-1", title: "Bienvenue au cours" }],
    },
    {
      id: "semana-1", emoji: "🧠", title: "Semaine 1 - PILIER MENTAL",
      lessons: [
        { id: "s1-d1", title: "Jour 1 : Pourquoi êtes-vous devenu cette personne ?" },
        { id: "s1-d2", title: "Jour 2 : Le pilote automatique" },
        { id: "s1-d3", title: "Jour 3 : Les pensées ne sont pas votre identité" },
        { id: "s1-d4", title: "Jour 4 : Habitudes invisibles" },
        { id: "s1-d5", title: "Jour 5 : Le dialogue intérieur" },
        { id: "s1-d6", title: "Jour 6 : L'influence de l'environnement" },
        { id: "s1-d7", title: "Jour 7 : Observer sans juger" },
      ],
    },
    {
      id: "semana-2", emoji: "🧍", title: "Semaine 2 - PILIER PHYSIQUE",
      lessons: [
        { id: "s2-d8", title: "Jour 8 : Le corps garde votre histoire" },
        { id: "s2-d9", title: "Jour 9 : Ralentir avant de changer" },
        { id: "s2-d10", title: "Jour 10 : Respiration et présence" },
        { id: "s2-d11", title: "Jour 11 : Micro pauses conscientes" },
        { id: "s2-d12", title: "Jour 12 : La fatigue n'est pas une faiblesse" },
        { id: "s2-d13", title: "Jour 13 : Faire taire les stimuli" },
        { id: "s2-d14", title: "Jour 14 : Un nouveau rythme de vie" },
      ],
    },
    {
      id: "semana-3", emoji: "💚", title: "Semaine 3 - PILIER ÉMOTIONNEL",
      lessons: [
        { id: "s3-d15", title: "Jour 15 : L'émotion n'est pas un ordre" },
        { id: "s3-d16", title: "Jour 16 : Irritation et impulsions" },
        { id: "s3-d17", title: "Jour 17 : Culpabilité et auto-exigence" },
        { id: "s3-d18", title: "Jour 18 : Peur et contrôle" },
        { id: "s3-d19", title: "Jour 19 : Frustration et attentes" },
        { id: "s3-d20", title: "Jour 20 : Répondre au lieu de réagir" },
        { id: "s3-d21", title: "Jour 21 : Stabilité émotionnelle" },
      ],
    },
    {
      id: "semana-4", emoji: "✨", title: "Semaine 4 - PILIER INTÉRIEUR",
      lessons: [
        { id: "s4-d22", title: "Jour 22 : Qui vous devenez" },
        { id: "s4-d23", title: "Jour 23 : Simplifier la vie" },
        { id: "s4-d24", title: "Jour 24 : Protéger l'esprit" },
        { id: "s4-d25", title: "Jour 25 : Créer une routine durable" },
        { id: "s4-d26", title: "Jour 26 : Gérer les rechutes" },
        { id: "s4-d27", title: "Jour 27 : Ajuster le chemin" },
        { id: "s4-d28", title: "Jour 28 : Rester présent" },
        { id: "s4-d29", title: "Jour 29 : Maintenir le nouveau schéma" },
        { id: "s4-d30", title: "Jour 30 : Clôture et continuité" },
      ],
    },
    {
      id: "bonus-1", emoji: "🎁", title: "BONUS 1 | Boissons Naturelles pour Digestion Lente et Abdomen Gonflé",
      lessons: [{ id: "b1-1", title: "Boissons Naturelles pour Digestion Lente et Abdomen Gonflé", type: "ebook" as const }],
    },
    {
      id: "bonus-2", emoji: "🎁", title: "BONUS 2 | Plantes et Boissons pour Améliorer le Sommeil Naturellement",
      lessons: [{ id: "b2-1", title: "Plantes et Boissons pour Améliorer le Sommeil Naturellement", type: "ebook" as const }],
    },
    {
      id: "bonus-3", emoji: "🎁", title: "BONUS 3 | Comment Éliminer les Pensées Répétitives et Arrêter de Trop Penser",
      lessons: [
        { id: "b3-1", title: "Pourquoi l'esprit répète les pensées et l'erreur de vouloir les contrôler" },
        { id: "b3-2", title: "Comment interrompre le cycle en pratique" },
        { id: "b3-3", title: "Que faire quand la répétition revient et comment éviter de retomber dans le même cycle" },
      ],
    },
  ],
  it: [
    {
      id: "intro", emoji: "📖", title: "Introduzione",
      lessons: [{ id: "intro-1", title: "Benvenuto al corso" }],
    },
    {
      id: "semana-1", emoji: "🧠", title: "Settimana 1 - PILASTRO MENTALE",
      lessons: [
        { id: "s1-d1", title: "Giorno 1: Perché sei diventato questa persona?" },
        { id: "s1-d2", title: "Giorno 2: Il pilota automatico" },
        { id: "s1-d3", title: "Giorno 3: I pensieri non sono la tua identità" },
        { id: "s1-d4", title: "Giorno 4: Abitudini invisibili" },
        { id: "s1-d5", title: "Giorno 5: Il dialogo interiore" },
        { id: "s1-d6", title: "Giorno 6: L'influenza dell'ambiente" },
        { id: "s1-d7", title: "Giorno 7: Osservare senza giudicare" },
      ],
    },
    {
      id: "semana-2", emoji: "🧍", title: "Settimana 2 - PILASTRO FISICO",
      lessons: [
        { id: "s2-d8", title: "Giorno 8: Il corpo conserva la tua storia" },
        { id: "s2-d9", title: "Giorno 9: Rallentare prima di cambiare" },
        { id: "s2-d10", title: "Giorno 10: Respirazione e presenza" },
        { id: "s2-d11", title: "Giorno 11: Micro pause consapevoli" },
        { id: "s2-d12", title: "Giorno 12: La stanchezza non è debolezza" },
        { id: "s2-d13", title: "Giorno 13: Silenziare gli stimoli" },
        { id: "s2-d14", title: "Giorno 14: Un nuovo ritmo di vita" },
      ],
    },
    {
      id: "semana-3", emoji: "💚", title: "Settimana 3 - PILASTRO EMOTIVO",
      lessons: [
        { id: "s3-d15", title: "Giorno 15: L'emozione non è un comando" },
        { id: "s3-d16", title: "Giorno 16: Irritazione e impulsi" },
        { id: "s3-d17", title: "Giorno 17: Colpa e autoesigenza" },
        { id: "s3-d18", title: "Giorno 18: Paura e controllo" },
        { id: "s3-d19", title: "Giorno 19: Frustrazione e aspettative" },
        { id: "s3-d20", title: "Giorno 20: Rispondere invece di reagire" },
        { id: "s3-d21", title: "Giorno 21: Stabilità emotiva" },
      ],
    },
    {
      id: "semana-4", emoji: "✨", title: "Settimana 4 - PILASTRO INTERIORE",
      lessons: [
        { id: "s4-d22", title: "Giorno 22: Chi stai diventando" },
        { id: "s4-d23", title: "Giorno 23: Semplificare la vita" },
        { id: "s4-d24", title: "Giorno 24: Proteggere la mente" },
        { id: "s4-d25", title: "Giorno 25: Creare una routine sostenibile" },
        { id: "s4-d26", title: "Giorno 26: Affrontare le ricadute" },
        { id: "s4-d27", title: "Giorno 27: Aggiustare il percorso" },
        { id: "s4-d28", title: "Giorno 28: Rimanere presente" },
        { id: "s4-d29", title: "Giorno 29: Mantenere il nuovo schema" },
        { id: "s4-d30", title: "Giorno 30: Chiusura e continuità" },
      ],
    },
    {
      id: "bonus-1", emoji: "🎁", title: "BONUS 1 | Bevande Naturali per Digestione Lenta e Addome Gonfio",
      lessons: [{ id: "b1-1", title: "Bevande Naturali per Digestione Lenta e Addome Gonfio", type: "ebook" as const }],
    },
    {
      id: "bonus-2", emoji: "🎁", title: "BONUS 2 | Piante e Bevande per Migliorare il Sonno Naturalmente",
      lessons: [{ id: "b2-1", title: "Piante e Bevande per Migliorare il Sonno Naturalmente", type: "ebook" as const }],
    },
    {
      id: "bonus-3", emoji: "🎁", title: "BONUS 3 | Come Eliminare i Pensieri Ripetitivi e Smettere di Pensare Troppo",
      lessons: [
        { id: "b3-1", title: "Perché la mente ripete i pensieri e l'errore di cercare di controllarli" },
        { id: "b3-2", title: "Come interrompere il ciclo nella pratica" },
        { id: "b3-3", title: "Cosa fare quando la ripetizione ritorna e come evitare di cadere nello stesso ciclo" },
      ],
    },
  ],
};
