const API_URL = 'http://localhost:3000/api'

export const proveedoresService = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/proveedores`)
    if (!res.ok) throw new Error('Error al obtener proveedores')
    const data = await res.json()
    return data.data
  },

  getById: async (id) => {
    const res = await fetch(`${API_URL}/proveedores/${id}`)
    if (!res.ok) throw new Error('Proveedor no encontrado')
    const data = await res.json()
    return data.data
  },

  create: async (proveedor) => {
    const res = await fetch(`${API_URL}/proveedores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proveedor)
    })
    if (!res.ok) throw new Error('Error al crear proveedor')
    const data = await res.json()
    return data.data
  },

  update: async (id, proveedor) => {
    const res = await fetch(`${API_URL}/proveedores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proveedor)
    })
    if (!res.ok) throw new Error('Error al actualizar proveedor')
    const data = await res.json()
    return data.data
  }
  
}

export const syncService = {
  sincronizarProveedores: async () => {
    const res = await fetch(`${API_URL}/sync/proveedores`, {
      method: 'POST'
    })
    if (!res.ok) throw new Error('Error al sincronizar proveedores')
    const data = await res.json()
    return data
  }
}