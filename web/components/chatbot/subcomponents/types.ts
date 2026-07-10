export interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  citation?: {
    source: string;
    excerpt: string;
  };
  timestamp: Date;
}
