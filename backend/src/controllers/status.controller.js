import prisma from '../config/prisma.js'
import { consultarStatusWinDev } from '../services/windevClient.js'

const STATUS_WINDEV_NO_VERIFICADO = {
  ok: false,
  servicio: 'Gestión Ventas API',
  estado: 'NO_DISPONIBLE',
  database: { estado: 'NO_VERIFICADA' },
}

export const getStatus = async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`

    res.json({
      ok: true,
      servicio: 'SES Compras API',
      estado: 'ACTIVO',
      database: {
        estado: 'ACTIVA',
      },
    })
  } catch (error) {
    console.error('[status] PostgreSQL no disponible:', error)

    res.status(503).json({
      ok: false,
      servicio: 'SES Compras API',
      estado: 'NO_DISPONIBLE',
      database: {
        estado: 'NO_DISPONIBLE',
      },
    })
  }
}

export const getStatusWinDev = async (req, res) => {
  const status = await consultarStatusWinDev(process.env.WINDEV_API_URL)

  if (status.disponible) return res.json(status.resultado)
  if (status.respuestaValida) return res.status(503).json(status.resultado)

  console.error('[status/windev] Gestión Ventas no disponible:', status.error)
  return res.status(503).json(STATUS_WINDEV_NO_VERIFICADO)
}
