import prisma from '../config/prisma.js'

const WINDEV_API = 'http://localhost/apicompras'

export const sincronizarProveedores = async (req, res, next) => {
  try {
    // Llamamos a WinDev API
    const desde = req.query.desde || ''
    const url = `${WINDEV_API}/proveedores/sync/${desde}`
    
    const response = await fetch(url)
    if (!response.ok) throw new Error('Error al llamar a WinDev API')
    
    const proveedores = await response.json()

    // UPSERT en PostgreSQL
    let actualizados = 0
    for (const p of proveedores) {
      
      //console.log('Procesando:', p)

      await prisma.compras_proveedores.upsert({
        where: { hfsql_proveedores_id: p.hfsql_proveedores_id },
        update: {
          razon_social: p.razon_social.trim(),
          cuit: String(p.cuit_nro),
          direccion: p.direccion ? p.direccion.trim() : null,
          email: p.email ? p.email.trim() : null,
          telefono: p.telefono ? p.telefono.trim() : null,
          updated_at_hfsql: new Date(p.fecha_modificacion)
        },
        create: {
          hfsql_proveedores_id: p.hfsql_proveedores_id,
          razon_social: p.razon_social.trim(),
          cuit: String(p.cuit_nro),
          direccion: p.direccion ? p.direccion.trim() : null,
          email: p.email ? p.email.trim() : null,
          telefono: p.telefono ? p.telefono.trim() : null,
          updated_at_hfsql: new Date(p.fecha_modificacion)
        }
      })
      actualizados++
    }

    res.json({ ok: true, sincronizados: actualizados })
  } catch (error) {
    next(error)
  }
}