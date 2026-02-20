export type LanguageCode = "pt" | "en" | "es" | "de" | "fr" | "it";

export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  flag: string;
  slug: string;
  courseName: string;
  mestraName: string;
  mestraTitle: string;
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
  audioTitle: string;
  audioDescription: string;
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
  welcomeGreeting: string;
  welcomeProgress: string;
  startLesson: string;
  backToOverview: string;
}

export const languages: LanguageConfig[] = [
  { code: "pt", name: "Português", flag: "🇧🇷", slug: "pt", courseName: "Caminhando com Lian", mestraName: "Lian", mestraTitle: "Mestra", accessButton: "Acessar Área de Membros" },
  { code: "en", name: "English", flag: "🇺🇸", slug: "en", courseName: "Walking with Mei", mestraName: "Mei", mestraTitle: "Master", accessButton: "Access Member Area" },
  { code: "es", name: "Español", flag: "🇪🇸", slug: "es", courseName: "Caminando con Yuna", mestraName: "Yuna", mestraTitle: "Maestra", accessButton: "Acceder al Área de Miembros" },
  { code: "de", name: "Deutsch", flag: "🇩🇪", slug: "de", courseName: "Der Weg mit Yuki", mestraName: "Yuki", mestraTitle: "Meisterin", accessButton: "Mitgliederbereich Zugreifen" },
  { code: "fr", name: "Français", flag: "🇫🇷", slug: "fr", courseName: "Cheminer avec Yumi", mestraName: "Yumi", mestraTitle: "Maître", accessButton: "Accéder à l'Espace Membre" },
  { code: "it", name: "Italiano", flag: "🇮🇹", slug: "it", courseName: "Camminando con Kaori", mestraName: "Kaori", mestraTitle: "Maestra", accessButton: "Accedi all'Area Membri" },
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
    previousLesson: "Anterior",
    nextLesson: "Próximo",
    ebookTitle: "Este conteúdo é um E-book",
    ebookDescription: "Clique no botão abaixo para baixar o PDF e ler no seu dispositivo.",
    downloadEbook: "Baixar E-book (PDF)",
    audioTitle: "Meditação Guiada",
    audioDescription: "Pressione play para ouvir",
    courseContent: "Conteúdo",
    menu: "Menu",
    viewCourseContent: "Ver Conteúdo",
    moduleLabel: "Categoria",
    lessonsLabel: "conteúdos",
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
    welcomeGreeting: "Bem-vinda",
    welcomeProgress: "conteúdos concluídos",
    startLesson: "Iniciar",
    backToOverview: "Início",
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
    previousLesson: "Previous",
    nextLesson: "Next",
    ebookTitle: "This content is an E-book",
    ebookDescription: "Click the button below to download the PDF and read on your device.",
    downloadEbook: "Download E-book (PDF)",
    audioTitle: "Guided Meditation",
    audioDescription: "Press play to listen",
    courseContent: "Content",
    menu: "Menu",
    viewCourseContent: "View Content",
    moduleLabel: "Category",
    lessonsLabel: "items",
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
    welcomeGreeting: "Welcome",
    welcomeProgress: "items completed",
    startLesson: "Start",
    backToOverview: "Home",
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
    previousLesson: "Anterior",
    nextLesson: "Siguiente",
    ebookTitle: "Este contenido es un E-book",
    ebookDescription: "Haz clic en el botón de abajo para descargar el PDF y leerlo en tu dispositivo.",
    downloadEbook: "Descargar E-book (PDF)",
    audioTitle: "Meditación Guiada",
    audioDescription: "Presiona play para escuchar",
    courseContent: "Contenido",
    menu: "Menú",
    viewCourseContent: "Ver Contenido",
    moduleLabel: "Categoría",
    lessonsLabel: "contenidos",
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
    welcomeGreeting: "Bienvenida",
    welcomeProgress: "contenidos completados",
    startLesson: "Iniciar",
    backToOverview: "Inicio",
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
    previousLesson: "Zurück",
    nextLesson: "Weiter",
    ebookTitle: "Dieser Inhalt ist ein E-Book",
    ebookDescription: "Klicke auf den Button unten, um das PDF herunterzuladen und auf deinem Gerät zu lesen.",
    downloadEbook: "E-Book herunterladen (PDF)",
    audioTitle: "Geführte Meditation",
    audioDescription: "Drücke Play zum Anhören",
    courseContent: "Inhalt",
    menu: "Menü",
    viewCourseContent: "Inhalt anzeigen",
    moduleLabel: "Kategorie",
    lessonsLabel: "Inhalte",
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
    welcomeGreeting: "Willkommen",
    welcomeProgress: "Inhalte abgeschlossen",
    startLesson: "Starten",
    backToOverview: "Start",
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
    previousLesson: "Précédent",
    nextLesson: "Suivant",
    ebookTitle: "Ce contenu est un E-book",
    ebookDescription: "Cliquez sur le bouton ci-dessous pour télécharger le PDF et le lire sur votre appareil.",
    downloadEbook: "Télécharger l'E-book (PDF)",
    audioTitle: "Méditation Guidée",
    audioDescription: "Appuyez sur play pour écouter",
    courseContent: "Contenu",
    menu: "Menu",
    viewCourseContent: "Voir le Contenu",
    moduleLabel: "Catégorie",
    lessonsLabel: "contenus",
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
    welcomeGreeting: "Bienvenue",
    welcomeProgress: "contenus terminés",
    startLesson: "Commencer",
    backToOverview: "Accueil",
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
    previousLesson: "Precedente",
    nextLesson: "Successivo",
    ebookTitle: "Questo contenuto è un E-book",
    ebookDescription: "Clicca il pulsante qui sotto per scaricare il PDF e leggerlo sul tuo dispositivo.",
    downloadEbook: "Scarica E-book (PDF)",
    audioTitle: "Meditazione Guidata",
    audioDescription: "Premi play per ascoltare",
    courseContent: "Contenuto",
    menu: "Menu",
    viewCourseContent: "Vedi Contenuto",
    moduleLabel: "Categoria",
    lessonsLabel: "contenuti",
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
    welcomeGreeting: "Benvenuta",
    welcomeProgress: "contenuti completati",
    startLesson: "Inizia",
    backToOverview: "Home",
  },
};

export function getLanguageBySlug(slug: string): LanguageConfig | undefined {
  return languages.find((l) => l.slug === slug);
}

export function getLanguageByCode(code: LanguageCode): LanguageConfig {
  return languages.find((l) => l.code === code)!;
}
