const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const articulosService = {
  buscarPorDescripcion: async (texto, proveedorId = 0) => {
    const res = await fetch(
      `${API_URL}/articulos/por-descripcion/${proveedorId}?texto=${encodeURIComponent(texto)}`
    )
    if (!res.ok) throw new Error('Error al buscar artículos')
    return res.json()
  },
/*   buscarPorDescripcion: async (texto, proveedorId = 0) => {
    const res = await fetch(
      `${API_URL}/articulos/por-descripcion/${proveedorId}/${encodeURIComponent(texto)}`
    )
    if (!res.ok) throw new Error('Error al buscar artículos')
    return res.json()
  }, */

  buscarPorCodigoBarras: async (codBarras, proveedorId = 0) => {
    const res = await fetch(
      `${API_URL}/articulos/por-codigo-barras/${proveedorId}/${encodeURIComponent(codBarras)}`
    )
    if (!res.ok) throw new Error('Error al buscar por código de barras')
    return res.json()
  },

  buscarPorId: async (articuloId, proveedorId = 0) => {
    const res = await fetch(
      `${API_URL}/articulos/por-id/${proveedorId}/${articuloId}`
    )
    if (!res.ok) throw new Error('Error al buscar artículo por ID')
    return res.json()
  },

  buscarPorCodigoProveedor: async (proveedorId, codigo) => {
    const res = await fetch(
      `${API_URL}/articulos/por-proveedor/${proveedorId}/${encodeURIComponent(codigo)}`
    )
    if (!res.ok) throw new Error('Error al buscar por código de proveedor')
    return res.json()
  }
}