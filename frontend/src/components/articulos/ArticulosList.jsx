import { useState } from 'react'
import { articulosService } from '../../services/articulosService.js'

export default function ArticulosList() {
  const [busqueda, setBusqueda] = useState('')
  const [tipoBusqueda, setTipoBusqueda] = useState('descripcion')
  const [articulos, setArticulos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [buscado, setBuscado] = useState(false)

  const buscar = async () => {
    if (!busqueda.trim()) return
    setCargando(true)
    setError(null)
    setBuscado(true)
    try {
      let resultado
      if (tipoBusqueda === 'descripcion') {
        resultado = await articulosService.buscarPorDescripcion(busqueda)
      } else if (tipoBusqueda === 'codBarras') {
        resultado = await articulosService.buscarPorCodigoBarras(busqueda)
      } else if (tipoBusqueda === 'id') {
        resultado = await articulosService.buscarPorId(busqueda)
      }
      setArticulos(resultado.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') buscar()
  }

  return (
    <div className="p-6">
      {/* Barra de búsqueda */}
      <div className="flex gap-3 mb-6">
        <select
          value={tipoBusqueda}
          onChange={(e) => setTipoBusqueda(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="descripcion">Descripción</option>
          <option value="codBarras">Código de barras</option>
          <option value="id">ID artículo</option>
        </select>

        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            tipoBusqueda === 'descripcion' ? 'Ej: coca cola 500' :
            tipoBusqueda === 'codBarras' ? 'Ej: 7790895000782' :
            'Ej: 1234'
          }
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={buscar}
          disabled={cargando || !busqueda.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Resultados */}
      {buscado && !cargando && articulos.length === 0 && !error && (
        <p className="text-gray-500 text-sm">No se encontraron artículos.</p>
      )}

      {articulos.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-gray-600 font-medium">ID</th>
                <th className="px-4 py-3 text-gray-600 font-medium">Descripción</th>
                <th className="px-4 py-3 text-gray-600 font-medium">Cód. Barras</th>
                <th className="px-4 py-3 text-gray-600 font-medium">Rubro</th>
                <th className="px-4 py-3 text-gray-600 font-medium">IVA %</th>
                <th className="px-4 py-3 text-gray-600 font-medium text-right">Costo</th>
                <th className="px-4 py-3 text-gray-600 font-medium text-right">Utilidad 1%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {articulos.map((a) => (
                <tr key={a.articulos_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{a.articulos_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{a.descripcion}</td>
                  <td className="px-4 py-3 text-gray-500">{a.cod_barras || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{a.rubro}</td>
                  <td className="px-4 py-3 text-gray-500">{a.alicuota_iva}%</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {a.signo_monetario} {Number(a.precio_costo).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{a.utilidad1}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}