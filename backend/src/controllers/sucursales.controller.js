const WINDEV_URL = process.env.WINDEV_API_URL

// =============================================================================
// GET /api/sucursales
// =============================================================================
export const getSucursales = async (req, res, next) => {
  try {
    const response = await fetch(`${WINDEV_URL}/apicompras/sucursales`)
    const data     = await response.json()
    // WinDev devuelve array directo, no { data: [] }
    const lista = Array.isArray(data) ? data : (data.data || [])
    res.json({ ok: true, data: lista })
  } catch (error) {
    next(error)
  }
}

// =============================================================================
// GET /api/sucursales/depositos/:sucursalId
// =============================================================================
export const getDepositosPorSucursal = async (req, res, next) => {
  try {
    const { sucursalId } = req.params
    const response = await fetch(`${WINDEV_URL}/apicompras/sucursales/depositos/${sucursalId}`)
    const data     = await response.json()
    res.json({ ok: true, data: data.data || [] })
  } catch (error) {
    next(error)
  }
}
