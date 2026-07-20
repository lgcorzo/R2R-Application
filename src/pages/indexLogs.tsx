import React, { useState, useMemo } from 'react';

import Highlight from '@/components/ui/highlight';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TablePagination } from '@/components/ui/TablePagination';
import { setColor, setTextColor } from '@/lib/utils';

type Log = {
  timestamp: string;
  severity: string;
  payload: string;
};

const LogTable = ({ logs, loading }: { logs: Log[]; loading: boolean }) => {
  const [sortField, setSortField] = useState<keyof Log>('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isLoading = loading;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = (logs || []).slice(indexOfFirstItem, indexOfLastItem);

  const sortedLogs = useMemo(() => {
    return [...currentItems].sort((a, b) => {
      if (a[sortField as keyof Log] < b[sortField as keyof Log]) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (a[sortField as keyof Log] > b[sortField as keyof Log]) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [currentItems, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="min-h-screen w-full">
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 md:gap-8 mb-4">
          <header className="glass-surface border-b border-white/[0.04] py-4 px-6 rounded-t-xl transition-all">
            <h3 className="text-xl font-bold text-foreground">Server Logs</h3>
          </header>
          <div className="glass-panel shadow-2xl border-white/10 rounded-xl w-full transition-all">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-center text-muted-foreground mr-4">
                  Loading Logs...
                </p>
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-400"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="w-[200px]"
                        onClick={() => {
                          setSortField('timestamp');
                          setSortDirection(
                            sortDirection === 'asc' ? 'desc' : 'asc'
                          );
                        }}
                      >
                        Timestamp
                      </TableHead>
                      <TableHead
                        className="w-[100px]"
                        onClick={() => {
                          setSortField('severity');
                          setSortDirection(
                            sortDirection === 'asc' ? 'desc' : 'asc'
                          );
                        }}
                      >
                        Severity
                      </TableHead>
                      <TableHead>Payload</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs && logs.length == 0 ? (
                      <TableRow key={0}>
                        <TableCell
                          colSpan={3}
                          className="font-mono text-center"
                        >
                          No logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      ''
                    )}
                    {sortedLogs.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">
                          {new Date(log.timestamp)
                            .toLocaleString('en-US', {
                              month: 'short',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              fractionalSecondDigits: 2,
                              hour12: false,
                            })
                            .toUpperCase()
                            .replace(',', '')}
                        </TableCell>
                        <TableCell>
                          <Highlight
                            color={setColor(log.severity)}
                            textColor={setTextColor(log.severity)}
                          >
                            {log.severity}
                          </Highlight>
                        </TableCell>
                        <TableCell>
                          {typeof log.payload === 'object'
                            ? JSON.stringify(log.payload)
                            : String(log.payload)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </main>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default LogTable;
