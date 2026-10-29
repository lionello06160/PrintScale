import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  searchText?: string;
}

export default function RoundedSelect({ value, onChange, options, label, id, disabled = false }: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label: string;
  id?: string;
  disabled?: boolean;
}) {
  const generatedId = useId(), triggerId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties | null>(null);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null), items = useRef<(HTMLButtonElement | null)[]>([]);
  const pending = useRef(0), typed = useRef({ text: "", time: 0 });
  const selected = Math.max(0, options.findIndex((option) => option.value === value));

  function focusOption(index: number) {
    const item = items.current[index], box = popup.current;
    if (!item || !box) return;
    item.focus({ preventScroll: true });
    if (item.offsetTop < box.scrollTop + 6) box.scrollTop = item.offsetTop - 6;
    else if (item.offsetTop + item.offsetHeight > box.scrollTop + box.clientHeight - 6)
      box.scrollTop = item.offsetTop + item.offsetHeight - box.clientHeight + 6;
  }
  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }
  function show(index: number) {
    if (disabled || !options.length) return;
    pending.current = index;
    typed.current = { text: "", time: 0 };
    setPosition(null);
    setOpen(true);
  }
  function place() {
    if (!trigger.current) return;
    const rect = trigger.current.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight) {
      close();
      return;
    }
    const below = innerHeight - rect.bottom, above = rect.top;
    const upwards = below < 200 && above > below;
    const width = Math.min(Math.max(rect.width, 200), innerWidth - 24);
    setPosition({
      left: Math.max(12, Math.min(rect.left, innerWidth - width - 12)),
      width,
      maxHeight: Math.min(320, Math.max(44, (upwards ? above : below) - 16)),
      ...(upwards ? { bottom: innerHeight - rect.top + 8 } : { top: rect.bottom + 8 }),
    });
  }
  useLayoutEffect(() => {
    if (open) place();
  }, [open]);
  const placed = position !== null;
  useEffect(() => {
    if (open && placed) focusOption(pending.current);
  }, [open, placed]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    const scroll = (event: Event) => {
      if (!popup.current?.contains(event.target as Node)) place();
    };
    const dismiss = () => close();
    document.addEventListener("pointerdown", outside);
    document.addEventListener("scroll", scroll, true);
    window.addEventListener("resize", dismiss);
    window.addEventListener("blur", dismiss);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("blur", dismiss);
    };
  }, [open]);

  return (
    <div className="rounded-select" ref={root} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) close();
    }}>
      <button
        id={triggerId}
        ref={trigger}
        className="rounded-select-trigger"
        type="button"
        role="combobox"
        aria-label={label}
        title={options[selected]?.label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? triggerId + "-options" : undefined}
        disabled={disabled || !options.length}
        onClick={() => open ? close(true) : show(selected)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            show(event.key === "ArrowUp" ? options.length - 1 : selected);
          }
        }}
      >
        <span>{options[selected]?.label ?? ""}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={popup}
          id={triggerId + "-options"}
          role="listbox"
          aria-label={label}
          className="language-popup rounded-select-popup"
          style={position ?? { visibility: "hidden" }}
          onKeyDown={(event) => {
            const index = items.current.indexOf(document.activeElement as HTMLButtonElement);
            let next: number | undefined;
            if (event.key === "ArrowDown") next = (index + 1) % options.length;
            if (event.key === "ArrowUp") next = (index + options.length - 1) % options.length;
            if (event.key === "Home") next = 0;
            if (event.key === "End") next = options.length - 1;
            if (event.key === "PageDown") next = Math.min(options.length - 1, index + 6);
            if (event.key === "PageUp") next = Math.max(0, index - 6);
            if (next !== undefined) {
              event.preventDefault();
              focusOption(next);
            } else if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              close(true);
            } else if (event.key === "Tab") {
              close(true);
            } else if (event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey && !event.altKey) {
              const now = Date.now();
              typed.current = { text: (now - typed.current.time < 700 ? typed.current.text : "") + event.key.toLocaleLowerCase(), time: now };
              const found = options.findIndex((option) => [option.label, option.searchText ?? ""].some((text) => text.toLocaleLowerCase().startsWith(typed.current.text)));
              if (found >= 0) {
                event.preventDefault();
                focusOption(found);
              }
            }
          }}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(element) => { items.current[index] = element; }}
              type="button"
              role="option"
              aria-selected={option.value === value}
              tabIndex={-1}
              onClick={() => { onChange(option.value); close(true); }}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={17} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
