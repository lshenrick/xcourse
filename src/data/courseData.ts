export interface Lesson {
  id: string;
  title: string;
  duration?: string;
  type?: "video" | "ebook" | "audio";
}

export interface Module {
  id: string;
  title: string;
  emoji: string;
  lessons: Lesson[];
}
