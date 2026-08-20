"use client";

import { useRef, useState } from "react";
import type { WindbannerPoint } from "@/lib/windbanner-types";
import { POINT_STATUS_BADGE_CLASS, POINT_STATUS_LABEL } from "@/lib/windbanner-status";

interface EditableAddressProps {
  pointId: string;
  endereco: string;
  onCommit: (id: string, endereco: string) => void;
}

// pointId is stable for the lifetime of this component instance (the parent
// <li> is keyed by it), so the initial useState value never goes stale.
function EditableAddress({ pointId, endereco, onCommit }: EditableAddressProps) {
  const [value, setValue] = useState(endereco);

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={() => {
        const trimmed = value.trim();
        if (trimmed && trimmed !== endereco) onCommit(pointId, trimmed);
        else setValue(endereco);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className="w-full truncate border-none bg-transparent p-0 text-sm text-slate-800 focus:outline-none focus:ring-0"
    />
  );
}

interface PointListProps {
  points: WindbannerPoint[];
  onReorder: (orderedIds: string[]) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, endereco: string) => void;
  onSelect?: (id: string | null) => void;
  selectedId?: string | null;
}

export default function PointList({ points, onReorder, onDelete, onRename, onSelect, selectedId }: PointListProps) {
  const pointIds = points.map((p) => p.id);
  const pointsKey = pointIds.join(",");

  const [order, setOrder] = useState<string[]>(pointIds);
  const [syncedKey, setSyncedKey] = useState(pointsKey);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const startOrderRef = useRef<string[]>([]);

  // Adjust state during rendering (React's documented pattern for syncing
  // local reorder state from props) rather than an effect, so a prop change
  // is reflected in the same commit — but skip it entirely mid-drag so a
  // reload triggered elsewhere doesn't yank the list out from under a touch.
  if (pointsKey !== syncedKey && !draggingId) {
    setSyncedKey(pointsKey);
    setOrder(pointIds);
  }

  const byId = new Map(points.map((p) => [p.id, p]));
  const orderedPoints = order.map((id) => byId.get(id)).filter((p): p is WindbannerPoint => Boolean(p));

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    e.currentTarget.setPointerCapture(e.pointerId);
    startOrderRef.current = order;
    setDraggingId(id);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!draggingId) return;
    const y = e.clientY;
    let closestId: string | null = null;
    let closestDist = Infinity;
    for (const [id, el] of itemRefs.current) {
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const dist = Math.abs(mid - y);
      if (dist < closestDist) {
        closestDist = dist;
        closestId = id;
      }
    }
    if (!closestId || closestId === draggingId) return;
    setOrder((current) => {
      const from = current.indexOf(draggingId);
      const to = current.indexOf(closestId as string);
      if (from === -1 || to === -1 || from === to) return current;
      const next = current.slice();
      next.splice(from, 1);
      next.splice(to, 0, draggingId);
      return next;
    });
  }

  function handlePointerUp() {
    if (!draggingId) return;
    const changed = JSON.stringify(startOrderRef.current) !== JSON.stringify(order);
    setDraggingId(null);
    if (changed) onReorder(order);
  }

  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = order.slice();
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    onReorder(next);
  }

  if (orderedPoints.length === 0) {
    return <p className="text-sm text-slate-400">Nenhum ponto cadastrado ainda. Busque um endereço acima ou clique no mapa.</p>;
  }

  return (
    <ol className="space-y-2">
      {orderedPoints.map((point, i) => (
        <li
          key={point.id}
          ref={(el) => {
            if (el) itemRefs.current.set(point.id, el);
            else itemRefs.current.delete(point.id);
          }}
          onClick={() => onSelect?.(point.id === selectedId ? null : point.id)}
          className={`flex items-center gap-2 rounded-lg border bg-white p-2.5 ${
            point.id === selectedId ? "border-slate-900" : "border-slate-200"
          } ${draggingId === point.id ? "opacity-60" : ""}`}
        >
          <button
            type="button"
            onPointerDown={(e) => handlePointerDown(e, point.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            aria-label="Arrastar para reordenar"
            className="shrink-0 cursor-grab touch-none select-none rounded p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing"
          >
            ⠿
          </button>
          <span className="w-5 shrink-0 text-xs font-semibold text-slate-400">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <EditableAddress pointId={point.id} endereco={point.endereco} onCommit={onRename} />
            <div className="mt-0.5 flex items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${POINT_STATUS_BADGE_CLASS[point.status]}`}>
                {POINT_STATUS_LABEL[point.status]}
              </span>
              {point.geocodeStatus === "approx" && <span className="text-xs text-amber-600">localização aproximada</span>}
              {point.geocodeStatus === "failed" && <span className="text-xs text-red-600">não geocodificado</span>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleMove(i, -1);
              }}
              disabled={i === 0}
              aria-label="Mover para cima"
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleMove(i, 1);
              }}
              disabled={i === orderedPoints.length - 1}
              aria-label="Mover para baixo"
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(point.id);
              }}
              aria-label="Remover ponto"
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
