// frontend/src/components/ui/alert.tsx
import * as React from "react";

type AlertVariant = "default" | "destructive";

export type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
};

function getVariantClasses(variant: AlertVariant | undefined): string {
  if (variant === "destructive") {
    return "border-red-500/40 bg-red-950/40 text-red-100";
  }

  return "border-slate-700 bg-slate-900/60 text-slate-100";
}

export function Alert(props: AlertProps) {
  const { className, variant = "default", children, ...rest } = props;

  return (
    <div
      className={
        "w-full rounded-lg border px-3 py-2 text-sm flex flex-col gap-1 " +
        getVariantClasses(variant) +
        (className ? " " + className : "")
      }
      role="alert"
      {...rest}
    >
      {children}
    </div>
  );
}

export type AlertTitleProps =
  React.HTMLAttributes<HTMLHeadingElement>;

export function AlertTitle(props: AlertTitleProps) {
  const { className, children, ...rest } = props;

  return (
    <h3
      className={
        "font-semibold leading-tight text-xs uppercase tracking-wide " +
        (className ? className : "")
      }
      {...rest}
    >
      {children}
    </h3>
  );
}

export type AlertDescriptionProps =
  React.HTMLAttributes<HTMLParagraphElement>;

export function AlertDescription(props: AlertDescriptionProps) {
  const { className, children, ...rest } = props;

  return (
    <p
      className={
        "text-xs leading-snug text-slate-200 " +
        (className ? className : "")
      }
      {...rest}
    >
      {children}
    </p>
  );
}
