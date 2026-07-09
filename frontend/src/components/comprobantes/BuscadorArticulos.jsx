import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function BuscadorArticulos({ proveedorId, onSeleccionar }) {
  const [modo, setModo] = useState("descripcion");
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const buscar = async () => {
    if (!texto.trim()) return;
    setBuscando(true);
    try {
      let url;
      if (modo === "descripcion")
        url = `${API_URL}/articulos/por-descripcion/${proveedorId}?texto=${encodeURIComponent(texto)}`;
      if (modo === "codBarras")
        url = `${API_URL}/articulos/por-codigo-barras/${proveedorId}/${encodeURIComponent(texto)}`;
      if (modo === "codProveedor")
        url = `${API_URL}/articulos/por-proveedor/${proveedorId}/${encodeURIComponent(texto)}`;
      if (modo === "codSes")
        url = `${API_URL}/articulos/por-id/${proveedorId}/${encodeURIComponent(texto)}`;
      const res = await fetch(url);
      const data = await res.json();
      const lista = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];
      if (lista.length === 1) {
        onSeleccionar(lista[0]);
        setTexto("");
        setResultados([]);
      } else setResultados(lista);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <select
          value={modo}
          onChange={(e) => {
            setModo(e.target.value);
            setResultados([]);
          }}
          className="border border-gray-300 rounded px-2 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="descripcion">Descripción</option>
          <option value="codBarras">Cód. barras</option>
          <option value="codProveedor">Cód. proveedor</option>
          <option value="codSes">Cod. SES</option>
        </select>
        <input
          type="text"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            if (!e.target.value) setResultados([]);
          }}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          placeholder="Buscar artículo..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
        <button
          onClick={buscar}
          disabled={buscando || !texto.trim()}
          className="bg-gray-100 border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
        >
          {buscando ? "..." : "Buscar"}
        </button>
      </div>
      {resultados.length > 0 && (
        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-64 overflow-y-auto">
          {resultados.map((a) => (
            <button
              key={a.articulos_id}
              onClick={() => {
                onSeleccionar(a);
                setTexto("");
                setResultados([]);
              }}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0"
            >
              <div className="text-sm font-medium text-gray-800">{a.descripcion}</div>
              <div className="text-xs text-gray-400 flex gap-3">
                {a.cod_barras && <span>CB: {a.cod_barras}</span>}
                <span>
                  Costo: ${" "}
                  {Number(a.precio_costo_proveedor || a.precio_costo).toLocaleString(
                    "es-AR",
                    { minimumFractionDigits: 3 }
                  )}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
