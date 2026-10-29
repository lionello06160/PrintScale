import { useEffect, useRef } from "react";
import { Printer, X } from "lucide-react";
import type { CopyKey } from "./i18n";

export default function PrintReminder({ open, onClose, t }: {
  open: boolean;
  onClose: () => void;
  t: (key: CopyKey) => string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      const focused = document.activeElement;
      opener.current = focused instanceof HTMLElement && focused !== document.body
        ? focused : document.querySelector<HTMLElement>(".brand");
      element.showModal();
      heading.current?.focus({ preventScroll: true });
    } else if (!open && element.open) {
      element.close();
      if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
    }
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="print-reminder"
      aria-labelledby="print-reminder-title"
      aria-describedby="print-reminder-intro"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (document.activeElement === heading.current ||
          (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }}
    >
      <div className="print-reminder-header">
        <Printer size={23} aria-hidden="true" />
        <span>{t("printBefore")}</span>
        <button className="icon-button" aria-label={t("close")} onClick={onClose}>
          <X size={22} />
        </button>
      </div>
      <div className="print-reminder-body">
        <div className="print-reminder-scale" aria-hidden="true">
          <span>100<span>%</span></span>
          <small>{t("actualSize")}</small>
        </div>
        <h2 id="print-reminder-title" ref={heading} tabIndex={-1}>{t("printTitle")}</h2>
        <p id="print-reminder-intro">{t("printReminderIntro")}</p>
        <ol className="print-reminder-checks">
          <li>{t("printReminderFit")}</li>
          <li>{t("printReminderBorderless")}</li>
          <li>{t("printReminderPaper")}</li>
        </ol>
      </div>
      <div className="print-reminder-actions">
        <button className="primary-button" onClick={onClose}>{t("printReminderContinue")}</button>
      </div>
    </dialog>
  );
}
