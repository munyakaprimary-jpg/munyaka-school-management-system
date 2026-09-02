import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';

type Book = {
  id: string;
  title: string;
  author: string;
  allocatedTo?: string;
};

type Props = {
  books: Book[];
};

export const BookAllocationTable: React.FC<Props> = ({ books }) => {
  const [allocation, setAllocation] = useState<Record<string, string>>({});

  useEffect(() => {
    const newAlloc: Record<string, string> = {};
    books.forEach((book) => {
      newAlloc[book.id] = book.allocatedTo ?? '';
    });
    setAllocation(newAlloc);
  }, [books]);

  const handleAllocate = (bookId: string, userId: string) => {
    setAllocation((prev) => ({ ...prev, [bookId]: userId }));
  };

  return (
    <Card>
      <CardContent>
        <Table>
          <TableContainer>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Allocated To</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {books.map((book) => (
                <TableRow key={book.id}>
                  <TableCell>{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>{allocation[book.id] || '—'}</TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      onClick={() => handleAllocate(book.id, 'user1')}
                    >
                      Allocate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableContainer>
        </Table>
      </CardContent>
    </Card>
  );
};