"use client";

import { useEffect, useId, useRef, useState } from "react";

export type ComboOption = { value: string; label: string };

export function Combo({
  name,
  label,
  defaultValue = "",
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: ComboOption[];
}) {
  const initial = options.some((option) => option.value === defaultValue) ? defaultValue : (options[0]?.value ?? "");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initial);
  const [active, setActive] = useState(Math.max(0, options.findIndex((option) => option.value === initial)));
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const listId = useId();
  const current = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    menu.current?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  function choose(next: string) {
    setValue(next);
    setOpen(false);
  }

  function onMenuKey(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(options.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(options[active]?.value ?? value);
    } else if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div className={open ? "combo open" : "combo"} ref={root}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        className="combo-trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{current?.label}</span>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6.2 8 10.2 12 6.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <ul
          ref={menu}
          id={listId}
          className="combo-menu"
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={onMenuKey}
        >
          {options.map((option, index) => (
            <li key={`${option.value}-${option.label}`}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`${option.value === value ? "on" : ""} ${index === active ? "active" : ""}`.trim()}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option.value)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
