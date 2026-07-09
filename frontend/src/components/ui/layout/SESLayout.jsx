import { NavLink } from "react-router-dom";
import SESTopBar from "@/components/ui/layout/SESTopBar.jsx";
import {
  ShoppingCart,
  FileText,
  Package,
  Truck,
  BarChart3,
  Settings,
  ChevronLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";

const menuPrincipal = [
  { label: "Nuevo comprobante", to: "/comprobantes", icon: FileText },
  { label: "Comprobantes", to: "/comprobantes", icon: FileText },
  { label: "Órdenes de compra", to: "/ordenes-compra", icon: ShoppingCart },
  { label: "Recepciones", to: "/recepciones", icon: Package },
  { label: "Proveedores", to: "/proveedores", icon: Truck },
  { label: "Artículos", to: "/articulos", icon: Package },
  { label: "Reportes", to: "/reportes", icon: BarChart3 },
];

export default function SESLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside
        className="
          fixed left-0 top-0 z-30 hidden h-screen w-72
          border-r border-slate-800
          bg-slate-900 text-white
          shadow-[8px_0_30px_rgba(15,23,42,.18)]
          lg:flex lg:flex-col
        "
      >
        <div className="px-7 py-7">
          <div className="text-2xl font-bold tracking-tight">SES ERP</div>
          <div className="mt-1 text-sm text-slate-400">Módulo de Compras</div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <div className="mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Compras
          </div>

          {menuPrincipal.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-blue-600 text-white shadow-[0_8px_18px_rgba(37,99,235,.35)]"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <NavLink
            to="/configuracion"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Settings size={19} />
            <span>Configuración</span>
          </NavLink>

          <button className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white">
            <ChevronLeft size={19} />
            <span>Ocultar menú</span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
  <SESTopBar />
  <main className="p-8">
    {children}
  </main>
</div>
    </div>
  );
}