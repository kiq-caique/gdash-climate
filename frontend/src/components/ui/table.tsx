// frontend/src/components/ui/table.tsx
import * as React from "react";

export type TableProps = React.TableHTMLAttributes<HTMLTableElement>;

export function Table(props: TableProps) {
  const { className, children, ...rest } = props;

  return (
    <table
      className={
        "w-full border-collapse text-sm " +
        (className ? className : "")
      }
      {...rest}
    >
      {children}
    </table>
  );
}

export type TableHeaderProps =
  React.HTMLAttributes<HTMLTableSectionElement>;

export function TableHeader(props: TableHeaderProps) {
  const { className, children, ...rest } = props;

  return (
    <thead
      className={
        "bg-slate-900/70 " + (className ? className : "")
      }
      {...rest}
    >
      {children}
    </thead>
  );
}

export type TableBodyProps =
  React.HTMLAttributes<HTMLTableSectionElement>;

export function TableBody(props: TableBodyProps) {
  const { className, children, ...rest } = props;

  return (
    <tbody
      className={className ? className : ""}
      {...rest}
    >
      {children}
    </tbody>
  );
}

export type TableRowProps =
  React.HTMLAttributes<HTMLTableRowElement>;

export function TableRow(props: TableRowProps) {
  const { className, children, ...rest } = props;

  return (
    <tr
      className={className ? className : ""}
      {...rest}
    >
      {children}
    </tr>
  );
}

export type TableHeadProps =
  React.ThHTMLAttributes<HTMLTableCellElement>;

export function TableHead(props: TableHeadProps) {
  const { className, children, ...rest } = props;

  return (
    <th
      className={
        "px-4 py-2 text-left font-semibold border-b border-slate-800 " +
        (className ? className : "")
      }
      {...rest}
    >
      {children}
    </th>
  );
}

export type TableCellProps =
  React.TdHTMLAttributes<HTMLTableCellElement>;

export function TableCell(props: TableCellProps) {
  const { className, children, ...rest } = props;

  return (
    <td
      className={
        "px-4 py-2 align-middle " + (className ? className : "")
      }
      {...rest}
    >
      {children}
    </td>
  );
}
