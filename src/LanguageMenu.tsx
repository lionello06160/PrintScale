import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import type { Language } from "./i18n";

const languages: { value: Language; label: string }[] = [
  { value: "zh-Hant", label: "繁體中文" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
];

export default function LanguageMenu({
  value,
  onChange,
}: {
  value: Language;
  onChange: (language: Language) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const pendingFocus = useRef(0);
  const selected = languages.findIndex((language) => language.value === value);

  useEffect(() => {
    if (!open) return;
    items.current[pendingFocus.current]?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const dismiss = () => setOpen(false);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", dismiss);
    window.addEventListener("blur", dismiss);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("blur", dismiss);
    };
  }, [open]);

  function openMenu(index: number) {
    pendingFocus.current = index;
    setOpen(true);
  }
  function closeAndFocus() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div
      className="language"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        id="language-trigger"
        type="button"
        className="language-trigger"
        aria-label={`Language: ${languages[selected].label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? "language-menu" : undefined}
        onClick={() => open ? closeAndFocus() : openMenu(selected)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openMenu(event.key === "ArrowUp" ? languages.length - 1 : selected);
          }
        }}
      >
        <Globe2 size={16} aria-hidden="true" />
        <span lang={value}>{languages[selected].label}</span>
        <ChevronDown size={14} className="language-chevron" aria-hidden="true" />
      </button>
      {open && (
        <div
          id="language-menu"
          className="language-popup"
          role="menu"
          aria-labelledby="language-trigger"
          onKeyDown={(event) => {
            const index = items.current.indexOf(document.activeElement as HTMLButtonElement);
            let next: number | undefined;
            if (event.key === "ArrowDown") next = (index + 1) % languages.length;
            if (event.key === "ArrowUp") next = (index + languages.length - 1) % languages.length;
            if (event.key === "Home") next = 0;
            if (event.key === "End") next = languages.length - 1;
            if (next !== undefined) {
              event.preventDefault();
              items.current[next]?.focus();
            } else if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              closeAndFocus();
            } else if (event.key === "Tab") {
              // Let the browser continue from the trigger to the next/previous control.
              closeAndFocus();
            }
          }}
        >
          {languages.map((language, index) => (
            <button
              key={language.value}
              ref={(element) => { items.current[index] = element; }}
              type="button"
              role="menuitemradio"
              aria-checked={language.value === value}
              lang={language.value}
              tabIndex={-1}
              onClick={() => {
                onChange(language.value);
                closeAndFocus();
              }}
            >
              <span>{language.label}</span>
              {language.value === value && <Check size={17} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
