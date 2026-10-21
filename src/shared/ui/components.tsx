import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { describeApiError } from "../api/product/shipsApi";

export function ShipImage({
  src,
  name,
  large = false,
}: {
  src: string | null;
  name: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <div className={"ship-image" + (large ? " ship-image-large" : "")}>
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="image-placeholder">
          <svg viewBox="0 0 96 64" aria-hidden="true">
            <path d="M13 37h70L70 53H27L13 37ZM30 37V24h34v13M41 24V13h12v11M48 13V5M5 58q11-6 22 0t22 0t22 0t20 0" />
          </svg>
          <span>Фото недоступно</span>
        </div>
      )}
    </div>
  );
}
export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <section className="state-panel" role="alert">
      <span className="state-symbol" aria-hidden="true">
        !
      </span>
      <p className="eyebrow">СВЯЗЬ С ФЛОТОМ</p>
      <h2>Не удалось загрузить данные</h2>
      <p>{describeApiError(error)}</p>
      <button className="button button-primary" onClick={onRetry}>
        Повторить загрузку <span aria-hidden="true">↻</span>
      </button>
    </section>
  );
}
export function LoadingState() {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" /> Загрузка флота…
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
export function Modal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current!;
    const focusable = () => [
      ...dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]',
      ),
    ];
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0],
        last = items.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialog.contains(document.activeElement))
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialog.contains(document.activeElement))
      ) {
        event.preventDefault();
        first?.focus();
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (!dialog.contains(event.target as Node)) focusable()[0]?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocus);
      previousFocus?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="filter-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-title"
        ref={dialogRef}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
