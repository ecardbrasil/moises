import AdminTile from "@/components/admin/AdminTile";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <h1 className="text-lg font-bold text-slate-900">Funcionalidades</h1>
      <p className="text-sm text-slate-500">Escolha uma área para gerenciar.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <AdminTile
          href="/admin/windbanners"
          title="Windbanners"
          description="Responsáveis, cotas e rotas de colocação de windbanners."
          icon="🚩"
        />
      </div>
    </div>
  );
}
