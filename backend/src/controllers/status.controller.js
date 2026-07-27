import prisma from '../config/prisma.js'

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
