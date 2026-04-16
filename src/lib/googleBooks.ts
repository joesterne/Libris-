import { Book, LibraryAvailability } from "../types";

export const searchBooks = async (query: string): Promise<Book[]> => {
  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`);
  const data = await response.json();
  
  if (!data.items) return [];

  return data.items.map((item: any) => ({
    id: item.id,
    title: item.volumeInfo.title,
    authors: item.volumeInfo.authors || ['Unknown Author'],
    description: item.volumeInfo.description || '',
    coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || `https://picsum.photos/seed/${item.id}/200/300`,
    pageCount: item.volumeInfo.pageCount || 0,
    categories: item.volumeInfo.categories || [],
    averageRating: item.volumeInfo.averageRating
  }));
};

export const getBookById = async (id: string): Promise<Book | null> => {
  const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}`);
  const item = await response.json();
  
  if (!item.id) return null;

  return {
    id: item.id,
    title: item.volumeInfo.title,
    authors: item.volumeInfo.authors || ['Unknown Author'],
    description: item.volumeInfo.description || '',
    coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || `https://picsum.photos/seed/${item.id}/200/300`,
    pageCount: item.volumeInfo.pageCount || 0,
    categories: item.volumeInfo.categories || [],
    averageRating: item.volumeInfo.averageRating
  };
};

// Simulated Libby availability check
export const checkLibbyAvailability = async (bookId: string): Promise<LibraryAvailability> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Deterministic "random" based on bookId string length/hash
  const hash = bookId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const mod = hash % 10;
  
  if (mod < 4) {
    return { bookId, status: 'available' };
  } else if (mod < 8) {
    return { bookId, status: 'waitlist', estimatedWaitWeeks: (mod - 3) * 2 };
  } else {
    return { bookId, status: 'unavailable' };
  }
};
