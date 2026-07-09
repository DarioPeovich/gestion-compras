import {
    Building2,
    MapPin,
    Clock,
    Menu,
    ChevronDown,
  } from "lucide-react";
  
  export default function SESTopBar({
    module = "Compras",
    empresa = "Estación Central",
    sucursal = "Sucursal 001",
    usuario = "Dario Peovich",
  }) {
    const ahora = new Date();
  
    const fecha = ahora.toLocaleDateString("es-AR");
    const hora = ahora.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  
    return (
      <header className="sticky top-0 z-20 h-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-full items-center justify-between px-8">
  
          <div className="flex items-center gap-6">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800">
              <Menu size={22} />
            </button>
  
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                {module}
              </h1>
            </div>
          </div>
  
          <div className="hidden items-center gap-6 text-sm text-slate-700 lg:flex">
  
            <div className="flex items-center gap-2 border-r border-slate-200 pr-6">
              <Building2 size={19} className="text-slate-500" />
              <span>{empresa}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
  
            <div className="flex items-center gap-2 border-r border-slate-200 pr-6">
              <MapPin size={19} className="text-slate-500" />
              <span>{sucursal}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
  
            <div className="flex items-center gap-3 border-r border-slate-200 pr-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                DP
              </div>
              <span>{usuario}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
  
            <div className="flex items-center gap-2 text-slate-600">
              <Clock size={18} className="text-slate-500" />
              <span>{fecha}</span>
              <span>{hora}</span>
            </div>
  
          </div>
  
        </div>
      </header>
    );
  }