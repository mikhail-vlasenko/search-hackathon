"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  Row,
  Cell,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, ArrowUpDown, X, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: Row<TData>) => void;
  renderRowDetails?: (row: Row<TData>) => React.ReactNode;
  className?: string;
  showRowDetails?: boolean;
  initialSorting?: SortingState;
  getRowClassName?: (row: Row<TData>) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  renderRowDetails,
  className,
  showRowDetails = true,
  initialSorting = [],
  getRowClassName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [selectedRow, setSelectedRow] = React.useState<Row<TData> | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  const handleRowClick = (row: Row<TData>) => {
    if (onRowClick) {
      onRowClick(row);
    }
    if (showRowDetails && renderRowDetails) {
      setSelectedRow(selectedRow?.id === row.id ? null : row);
    }
  };

  const closeSidePeek = () => {
    setSelectedRow(null);
  };

  return (
    <div className={cn("relative bg-white", className)}>
      <div className="flex bg-white">
        {/* Main Table */}
        <div
          className={cn(
            "flex-1 transition-all duration-300",
            selectedRow ? "mr-96" : "mr-0"
          )}
        >
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sortDirection = header.column.getIsSorted();

                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder ? null : (
                            <div
                              className={cn(
                                "flex items-center space-x-2",
                                canSort &&
                                  "cursor-pointer select-none hover:bg-muted/50 rounded p-2 -m-2"
                              )}
                              onClick={
                                canSort
                                  ? header.column.getToggleSortingHandler()
                                  : undefined
                              }
                            >
                              <span>
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </span>
                              {canSort && (
                                <div className="flex flex-col">
                                  {sortDirection === "asc" ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : sortDirection === "desc" ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </TableHead>
                      );
                    })}
                    {showRowDetails && renderRowDetails && (
                      <TableHead className="w-12">
                        <span className="sr-only">Details</span>
                      </TableHead>
                    )}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row, index) => (
                      <motion.tr
                        key={row.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.02,
                          layout: { duration: 0.3 },
                        }}
                        className={cn(
                          "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors cursor-pointer",
                          selectedRow?.id === row.id && "bg-muted",
                          getRowClassName?.(row)
                        )}
                        onClick={() => handleRowClick(row)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="p-4">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                        {showRowDetails && renderRowDetails && (
                          <TableCell className="p-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(row);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </motion.tr>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + (showRowDetails ? 1 : 0)}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Side Peek Panel */}
        <AnimatePresence>
          {selectedRow && renderRowDetails && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-lg z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Row Details</h3>
                  <Button variant="ghost" size="sm" onClick={closeSidePeek}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {renderRowDetails(selectedRow)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Utility function to create common cell renderers
export const createCellRenderer = {
  badge:
    (
      variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
    ) =>
    (info: any) =>
      <Badge variant={variant}>{info.getValue()}</Badge>,

  coloredNumber: (getColor: (value: number) => string) => (info: any) => {
    const value = info.getValue() as number;
    return <span className={cn("font-medium", getColor(value))}>{value}</span>;
  },

  percentage: (info: any) => <span>{info.getValue()}%</span>,

  ranking: (info: any) => {
    const value = info.getValue() as number;
    const colorClass =
      value <= 3
        ? "text-green-600"
        : value <= 5
        ? "text-yellow-600"
        : "text-red-600";
    return <span className={cn("font-bold", colorClass)}>#{value}</span>;
  },

  localeNumber: (info: any) => (
    <span>{(info.getValue() as number).toLocaleString()}</span>
  ),

  difficulty: (info: any) => {
    const value = info.getValue() as number;
    const colorClass =
      value < 30
        ? "text-green-600"
        : value < 70
        ? "text-yellow-600"
        : "text-red-600";
    return <span className={cn("font-medium", colorClass)}>{value}</span>;
  },

  truncatedText:
    (maxLength: number = 100) =>
    (info: any) => {
      const value = info.getValue() as string;
      return (
        <span className="max-w-xs" title={value}>
          {value.length > maxLength
            ? `${value.substring(0, maxLength)}...`
            : value}
        </span>
      );
    },
};
