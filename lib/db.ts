import Dexie, { type EntityTable } from 'dexie';

interface ChatSession {
  id: string; // e.g., "chat_12345"
  title: string; 
  updatedAt: number;
}

interface Message {
  id?: number;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  hasImage: boolean;
}

const db = new Dexie('EdgeVisionDatabase') as Dexie & {
  chats: EntityTable<ChatSession, 'id'>;
  messages: EntityTable<Message, 'id'>;
};

db.version(1).stores({
  chats: 'id, updatedAt', // Primary key and indexed prop
  messages: '++id, chatId' // Auto-increment ID, indexed by chatId
});

export { db };