import prisma from '../config/prisma.js'

const WINDEV_API = 'http://localhost/apicompras'

export const buscarPorCodigoProveedor = async (req, res, next) => {
  try {
    const { proveedorId, codigo } = req.params
    const url = `${WINDEV_API}/articulos/por-proveedor/${proveedorId}/${encodeURIComponent(codigo)}`

    const response = await fetch(url)
    if (!response.ok) throw new Error('Error al llamar a WinDev API')

    const data = await response.json()
    res.json({ ok: true, data })
  } catch (error) {
    next(error)
  }
}

export const buscarPorCodigoBarras = async (req, res, next) => {
  try {
    const { proveedorId, codBarras } = req.params
    const url = `${WINDEV_API}/articulos/por-codigo-barras/${proveedorId}/${encodeURIComponent(codBarras)}`

    const response = await fetch(url)
    if (!response.ok) throw new Error('Error al llamar a WinDev API')

    const data = await response.json()
    res.json({ ok: true, data })
  } catch (error) {
    next(error)
  }
}
export const buscarPorDescripcion = async (req, res, next) => {
  try {
    const { proveedorId } = req.params
    const { texto } = req.query
    const url = `${WINDEV_API}/articulos/por-descripcion/${proveedorId}/${encodeURIComponent(texto)}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Error al llamar a WinDev API')
    const data = await response.json()
    res.json({ ok: true, data })
  } catch (error) {
    next(error)
  }
}
/* export const buscarPorDescripcion = async (req, res, next) => {
  try {
    const { proveedorId, texto } = req.params
    const url = `${WINDEV_API}/articulos/por-descripcion/${proveedorId}/${encodeURIComponent(texto)}`

    const response = await fetch(url)
    if (!response.ok) throw new Error('Error al llamar a WinDev API')

    const data = await response.json()
    res.json({ ok: true, data })
  } catch (error) {
    next(error)
  }
} */

export const buscarPorId = async (req, res, next) => {
    try {
      const { proveedorId, articuloId } = req.params
      const url = `${WINDEV_API}/articulos/por-id/${proveedorId}/${articuloId}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Error al llamar a WinDev API')
      const data = await response.json()
      res.json({ ok: true, data })
    } catch (error) {
      next(error)
    }
  }