// ARCHIVO TEMPORAL DE DIAGNÓSTICO
// Sirve para verificar qué responde la API de WinDev sin que Prisma intervenga.
// Borrar una vez resuelta la sincronización de proveedores.

const WINDEV_API = 'http://localhost/apicompras'

export const testWinDevProveedores = async (req, res, next) => {
  try {
    const desde = req.query.desde || ''
    const url = `${WINDEV_API}/proveedores/sync/${desde}`

    const response = await fetch(url)
    const text = await response.text()

    res.json({
      ok: response.ok,
      status: response.status,
      url,
      raw: text
    })
  } catch (error) {
    next(error)
  }
}