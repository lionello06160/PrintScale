import type { CopyKey } from "./i18n";

export default function PrintMarkLegend({ t }: { t: (key: CopyKey) => string }) {
  return (
    <div className="print-mark-legend">
      <div>
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M3 10h9M16 3v9M20 29v-9M29 16h-9" />
        </svg>
        <span><strong>{t("cutSymbol")}</strong><span>{t("cutSymbolHelp")}</span></span>
      </div>
      <div>
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="9" />
          <path d="M16 3v26M3 16h26" />
        </svg>
        <span><strong>{t("registrationSymbol")}</strong><span>{t("registrationSymbolHelp")}</span></span>
      </div>
    </div>
  );
}
