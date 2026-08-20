"use client";

import { useState } from "react";
import type { WindbannerResponsavel } from "@/lib/windbanner-types";

const NEW_VALUE = "__new__";

interface ResponsavelPickerProps {
  responsaveis: WindbannerResponsavel[];
  value: string | null;
  onChange: (id: string) => void;
  onCreate: (nome: string) => Promise<WindbannerResponsavel>;
}

export default function ResponsavelPicker({ responsaveis, value, onChange, onCreate }: ResponsavelPickerProps) {
  const [creating, setCreating] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const nome = newNome.trim();
    if (!nome) return;
    setSaving(true);
    try {
      const responsavel = await onCreate(nome);
      onChange(responsavel.id);
      setCreating(false);
      setNewNome("");
    } finally {
      setSaving(false);
    }
  }

  if (creating) {
    return (
      <div className="flex flex-wrap gap-2">
        <input
          autoFocus
          value={newNome}
          onChange={(e) => setNewNome(e.target.value)}
          placeholder="Nome do novo responsável"
          className="min-w-0 flex-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !newNome.trim()}
          className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {saving ? "Criando…" : "Adicionar"}
        </button>
        <button type="button" onClick={() => setCreating(false)} className="text-xs text-slate-500 hover:underline">
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        if (e.target.value === NEW_VALUE) setCreating(true);
        else onChange(e.target.value);
      }}
      className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
    >
      <option value="" disabled>
        Selecione um responsável
      </option>
      {responsaveis.map((r) => (
        <option key={r.id} value={r.id}>
          {r.nome}
        </option>
      ))}
      <option value={NEW_VALUE}>+ Novo responsável</option>
    </select>
  );
}
