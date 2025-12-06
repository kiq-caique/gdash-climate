// frontend/src/components/ui/label.tsx
import * as React from "react";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label(props: LabelProps) {
  const { className, children, ...rest } = props;

  return (
    <label
      className={
        "block text-xs font-medium text-slate-200 mb-1 " +
        (className ? className : "")
      }
      {...rest}
    >
      {children}
    </label>
  );
}
