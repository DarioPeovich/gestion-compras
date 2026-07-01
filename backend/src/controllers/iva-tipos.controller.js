const WINDEV_URL = process.env.WINDEV_API_URL

// =============================================================================
// GET /api/iva-tipos
// =============================================================================
export const getIvaTipos = async (req, res, next) => {
  try {
    const response = await fetch(`${WINDEV_URL}/apicompras/iva-tipos`)
    const data     = await response.json()
    res.json({ ok: true, data: data || [] })
  } catch (error) {
    next(error)
  }
}
