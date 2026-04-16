import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { LibraryAvailability } from '../types';
import { checkLibbyAvailability } from '../lib/googleBooks';
import { Sparkles } from 'lucide-react';

interface LibbyBadgeProps {
  bookId: string;
  className?: string;
}

export const LibbyBadge: React.FC<LibbyBadgeProps> = ({ bookId, className }) => {
  const [availability, setAvailability] = useState<LibraryAvailability | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    checkLibbyAvailability(bookId).then((result) => {
      if (isMounted) {
        setAvailability(result);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  if (loading) {
    return (
      <Badge variant="secondary" className={`text-[8px] px-1.5 h-5 bg-black/5 text-black border-none shadow-none shrink-0 opacity-50 ${className}`}>
        <Sparkles className="w-2 h-2 mr-1 animate-spin" />
        Checking...
      </Badge>
    );
  }

  if (!availability) return null;

  return (
    <Badge 
      variant={availability.status === 'available' ? 'default' : 'secondary'} 
      className={`text-[8px] px-1.5 h-5 bg-black/5 text-black border-none shadow-none shrink-0 ${className}`}
    >
      {availability.status === 'available' ? 'Available' : availability.status === 'waitlist' ? `${availability.estimatedWaitWeeks}w` : 'N/A'}
    </Badge>
  );
};
