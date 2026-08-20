"use client";

import { useEffect, useRef, useState } from "react";
import type { GeocodeSuggestion } from "@/lib/geocode";

interface AddressAutocompleteProps {
  onSelect: (suggestion: GeocodeSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function AddressAutocomplete({ onSelect, placeholder, disabled }: AddressAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) return;
    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      fetch(`/api/geocode/suggestions?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Erro ao buscar endereço"))))
        .then((data: GeocodeSuggestion[]) => {
          setSuggestions(data);
          setOpen(true);
          setActiveIndex(-1);
        })
        .catch((e: unknown) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setSuggestions([]);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(suggestion: GeocodeSuggestion) {
    onSelect(suggestion);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative isolate">
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls="address-autocomplete-listbox"
        aria-activedescendant={activeIndex >= 0 ? `address-suggestion-${activeIndex}` : undefined}
        autoComplete="off"
        value={query}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          if (next.trim().length < 3) {
            abortRef.current?.abort();
            setSuggestions([]);
            setOpen(false);
          }
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Buscar rua, avenida ou ponto de referência…"}
        className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none disabled:opacity-50"
      />
      {loading && <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">…</span>}
      {open && suggestions.length > 0 && (
        <ul
          id="address-autocomplete-listbox"
          role="listbox"
          className="absolute z-[1000] mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat}-${s.lng}-${i}`}
              id={`address-suggestion-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
              className={`cursor-pointer px-3 py-2 text-sm ${i === activeIndex ? "bg-slate-100" : "hover:bg-slate-50"}`}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
