"use client";

// Botón de envío que pide confirmación antes de dejar pasar el submit.
// Es un componente cliente porque necesita onClick; el <form> que lo contiene
// sigue apuntando a una Server Action.

export function ConfirmButton({
  message,
  children,
  className,
  disabled,
  title,
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      title={title}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
