import { useState, useCallback } from 'react';
import { Book } from '../types';
import { getBookById } from '../lib/googleBooks';

export function useBookCache() {
  const [books, setBooks] = useState<Record<string, Book>>({});

  const fetchBookIfNeeded = useCallback(async (bookId: string) => {
    // Use a callback to check current state to avoid stale closure issues
    setBooks((prev) => {
      if (!prev[bookId]) {
        // Kick off async fetch outside of the setter
        getBookById(bookId).then((book) => {
          if (book) {
            setBooks((current) => ({ ...current, [book.id]: book }));
          }
        });
      }
      return prev;
    });
  }, []);

  const cacheBook = useCallback((book: Book) => {
    setBooks((prev) => ({ ...prev, [book.id]: book }));
  }, []);

  const cacheBooks = useCallback((newBooks: Book[]) => {
    setBooks((prev) => {
      const updated = { ...prev };
      newBooks.forEach((b) => {
        updated[b.id] = b;
      });
      return updated;
    });
  }, []);

  return { books, fetchBookIfNeeded, cacheBook, cacheBooks };
}
