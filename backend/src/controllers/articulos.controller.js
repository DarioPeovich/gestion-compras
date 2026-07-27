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
    const proveedor = await prisma.compras_proveedores.findUnique({
      where: { id: Number(proveedorId) },
      select: { hfsql_proveedores_id: true },
    })
    if (!proveedor?.hfsql_proveedores_id) {
      throw new Error('El proveedor no tiene un ID HFSQL asociado')
    }
    const url = `${WINDEV_API}/articulos/por-codigo-barras/${proveedor.hfsql_proveedores_id}/${encodeURIComponent(codBarras)}`

    const response = await fetch(url)
    if (!response.ok) throw new Error('Error al llamar a WinDev API')

    const data = await response.json()
    res.json({ ok: true, data })
  } catch (error) {
    next(error)
  }
}

export const buscarPorCodigoSes = async (req, res, next) => {
  try {
    const { proveedorId, articuloId } = req.params
    const proveedorLocalId = Number(proveedorId)
    const articuloSesId = Number(articuloId)

    if (
      !Number.isSafeInteger(proveedorLocalId) || proveedorLocalId <= 0 ||
      !Number.isSafeInteger(articuloSesId) || articuloSesId <= 0
    ) {
      return res.status(400).json({
        ok: false,
        error: 'proveedorId y articuloId deben ser enteros positivos',
      })
    }

    const proveedor = await prisma.compras_proveedores.findUnique({
      where: { id: proveedorLocalId },
      select: { hfsql_proveedores_id: true },
    })
    if (!proveedor) {
      return res.status(404).json({
        ok: false,
        error: 'Proveedor no encontrado',
      })
    }

    const proveedorHfsqlId = Number(proveedor.hfsql_proveedores_id)
    if (!Number.isInteger(proveedorHfsqlId) || proveedorHfsqlId <= 0) {
      return res.status(422).json({
        ok: false,
        error: 'El proveedor no tiene un ID HFSQL válido asociado',
      })
    }

    const url = `${WINDEV_API}/articulos/por-codigo-ses/${encodeURIComponent(proveedorHfsqlId)}/${encodeURIComponent(articuloSesId)}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Error al llamar a WinDev API')

    const data = await response.json()
    if (!Array.isArray(data)) {
      return res.status(502).json({
        ok: false,
        error: 'WinDev devolvió un formato inválido para la búsqueda por Código SES',
      })
    }

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
