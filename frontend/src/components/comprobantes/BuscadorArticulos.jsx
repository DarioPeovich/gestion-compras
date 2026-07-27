import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function BuscadorArticulos({ proveedorId, onSeleccionar }) {
  const [modo, setModo] = useState("descripcion");
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");
  const [dropdownPos, setDropdownPos] = useState(null);
  const buscadorRef = useRef(null);
  const dropdownRef = useRef(null);

  const dropdownAbierto = resultados.length > 0;

  const actualizarPosicion = useCallback(() => {
    const elemento = buscadorRef.current;
    if (!elemento) return;

    const rect = elemento.getBoundingClientRect();
    const margen = 4;
    const margenViewport = 8;
    const espacioAbajo = window.innerHeight - rect.bottom - margenViewport;
    const espacioArriba = rect.top - margenViewport;
    const abrirArriba = espacioAbajo < 180 && espacioArriba > espacioAbajo;
    const maxHeight = Math.min(
      320,
      Math.max(160, abrirArriba ? espacioArriba - margen : espacioAbajo - margen)
    );

    setDropdownPos({
      left: rect.left,
      top: abrirArriba ? Math.max(margenViewport, rect.top - maxHeight - margen) : rect.bottom + margen,
      width: rect.width,
      maxHeight,
    });
  }, []);

  useLayoutEffect(() => {
    if (dropdownAbierto) actualizarPosicion();
  }, [dropdownAbierto, actualizarPosicion]);

  useEffect(() => {
    if (!dropdownAbierto) return;

    const cerrarSiClickFuera = (event) => {
      if (
        !buscadorRef.current?.contains(event.target) &&
        !dropdownRef.current?.contains(event.target)
      ) {
        setResultados([]);
      }
    };
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") setResultados([]);
    };

    window.addEventListener("resize", actualizarPosicion);
    window.addEventListener("scroll", actualizarPosicion, true);
    document.addEventListener("mousedown", cerrarSiClickFuera);
    document.addEventListener("keydown", cerrarConEscape);

    return () => {
      window.removeEventListener("resize", actualizarPosicion);
      window.removeEventListener("scroll", actualizarPosicion, true);
      document.removeEventListener("mousedown", cerrarSiClickFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [dropdownAbierto, actualizarPosicion]);

  const buscar = async () => {
    if (!texto.trim()) return;
    const textoBusqueda = texto.trim();
    if (modo === "codSes") {
      const articuloId = Number(textoBusqueda);
      if (!/^\d+$/.test(textoBusqueda) || !Number.isSafeInteger(articuloId) || articuloId <= 0) {
        setResultados([]);
        setErrorBusqueda("El Código SES debe ser un entero positivo");
        return;
      }
    }
    setBuscando(true);
    setErrorBusqueda("");
    try {
      let url;
      if (modo === "descripcion")
        url = `${API_URL}/articulos/por-descripcion/${proveedorId}?texto=${encodeURIComponent(texto)}`;
      if (modo === "codBarras")
        url = `${API_URL}/articulos/por-codigo-barras/${proveedorId}/${encodeURIComponent(texto)}`;
      if (modo === "codProveedor")
        url = `${API_URL}/articulos/por-proveedor/${proveedorId}/${encodeURIComponent(texto)}`;
      if (modo === "codSes")
        url = `${API_URL}/articulos/por-codigo-ses/${proveedorId}/${encodeURIComponent(textoBusqueda)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error("Error al buscar artículos");
      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : data.data
            ? [data.data]
            : [];
      if (lista.length === 1) {
        onSeleccionar(lista[0]);
        setTexto("");
        setResultados([]);
        setErrorBusqueda("");
      } else {
        setResultados(lista);
        setErrorBusqueda(lista.length === 0 ? "No se encontraron artículos" : "");
      }
    } catch {
      setResultados([]);
      setErrorBusqueda("No se pudo realizar la búsqueda");
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div ref={buscadorRef} className="relative">
      <div className="flex gap-2">
        <select
          value={modo}
          onChange={(e) => {
            setModo(e.target.value);
            setTexto("");
            setResultados([]);
            setErrorBusqueda("");
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
            setErrorBusqueda("");
            if (!e.target.value) setResultados([]);
          }}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          placeholder="Buscar artículo..."
          className={`flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
            errorBusqueda
              ? "border-red-400 focus:ring-red-400"
              : "border-gray-300 focus:ring-blue-500"
          }`}
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
      {errorBusqueda && (
        <p className="mt-1 text-xs text-red-500">{errorBusqueda}</p>
      )}
      {dropdownAbierto && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[1000] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
          style={{
            left: dropdownPos.left,
            top: dropdownPos.top,
            width: dropdownPos.width,
            maxHeight: dropdownPos.maxHeight,
          }}
        >
          {resultados.map((a) => (
            <button
              key={a.articulos_id}
              onClick={() => {
                onSeleccionar(a);
                setTexto("");
                setResultados([]);
                setErrorBusqueda("");
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
        </div>,
        document.body
      )}
    </div>
  );
}
