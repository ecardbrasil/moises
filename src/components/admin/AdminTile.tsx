import Link from "next/link";
import type { ReactNode } from "react";

interface AdminTileProps {
  href: string;
  title: string;
  description: string;
  icon?: ReactNode;
}

export default function AdminTile({ href, title, description, icon }: AdminTileProps) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      {icon && <span className="text-2xl leading-none">{icon}</span>}
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  );
}
