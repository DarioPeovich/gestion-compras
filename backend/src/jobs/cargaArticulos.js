import prisma from '../config/prisma.js'

const WINDEV_API = 'http://localhost/apicompras'
const TAMANIO_LOTE = 2000
const PROCESO = 'articulos'

// Convierte un Date a formato AAAAMMDDHHMMSS, que es lo que HFSQL espera
// en el filtro de fecha (no acepta separadores tipo '-' ':' ' ').
function formatearFechaHFSQL(fecha) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    fecha.getFullYear() +
    pad(fecha.getMonth() + 1) +
    pad(fecha.getDate()) +
    pad(fecha.getHours()) +
    pad(fecha.getMinutes()) +
    pad(fecha.getSeconds())
  )
}

// Mapea un artículo recibido de WinDev al shape de compras_articulos_cache.
// Todo lo que no tiene columna propia se mete en `extra` (Json) para no perderlo
// sin tener que migrar el schema cada vez que aparece un campo nuevo de interés secundario.
function mapearArticulo(a) {
  const camposConColumna = new Set([
    'hfsql_articulos_id', 'descripcion', 'precio_costo',
    'utilidad1', 'utilidad2', 'utilidad3', 'utilidad4', 'utilidad5',
    'alicuota_iva', 'imp_interno_tipo', 'imp_interno_alicuota', 'imp_interno_monto',
    'itc', 'idc', 'fecha_actualizacion', 'cod_barras'
  ])

  const extra = {}
  for (const key of Object.keys(a)) {
    if (!camposConColumna.has(key)) extra[key] = a[key]
  }

  return {
    hfsql_articulos_id: a.hfsql_articulos_id,
    cod_barras: a.cod_barras ? String(a.cod_barras).trim() : null,
    descripcion: a.descripcion ? a.descripcion.trim() : '',
    precio_costo: a.precio_costo ?? null,
    utilidad_lista_1: a.utilidad1 ?? null,
    utilidad_lista_2: a.utilidad2 ?? null,
    utilidad_lista_3: a.utilidad3 ?? null,
    utilidad_lista_4: a.utilidad4 ?? null,
    utilidad_lista_5: a.utilidad5 ?? null,
    alicuota_iva: a.alicuota_iva ?? null,
    imp_interno_tipo: a.imp_interno_tipo ?? null,
    imp_interno_alicuota: a.imp_interno_alicuota ?? null,
    imp_interno_monto: a.imp_interno_monto ?? null,
    imp_transf_comb: a.itc ?? null,
    imp_dioxido_carbono: a.idc ?? null,
    updated_at_hfsql: new Date(a.fecha_actualizacion),
    extra: Object.keys(extra).length ? extra : null
  }
}

async function upsertArticulo(a) {
  const data = mapearArticulo(a)
  await prisma.compras_articulos_cache.upsert({
    where: { hfsql_articulos_id: data.hfsql_articulos_id },
    update: data,
    create: data
  })
}

async function actualizarStatus(cambios) {
  await prisma.compras_sync_status.upsert({
    where: { proceso: PROCESO },
    update: { ...cambios, actualizado_en: new Date() },
    create: { proceso: PROCESO, ...cambios, actualizado_en: new Date() }
  })
}

// Carga inicial paginada por rango de articulosID.
// El corte primario es por cantidad de registros procesados vs. el count de referencia.
// Como red de seguridad, si se encuentran varios lotes vacíos consecutivos, se corta
// igual aunque no se haya alcanzado el total — protege contra un cursor que haya quedado
// lejos del rango real de datos tras una interrupción previa, evitando un bucle que pida
// lotes vacíos indefinidamente.
export async function cargaPaginadaPorRango(cursorInicial) {
  console.log('[articulos] Iniciando carga inicial paginada...')

  const resCount = await fetch(`${WINDEV_API}/articulos/count`)
  if (!resCount.ok) throw new Error('Error al obtener count de artículos desde WinDev')
  const { total } = await resCount.json()

  let desde = cursorInicial ? parseInt(cursorInicial, 10) : 1
  let procesados = 0

  if (cursorInicial) {
    const statusPrevio = await prisma.compras_sync_status.findUnique({ where: { proceso: PROCESO } })
    procesados = statusPrevio?.registros_procesados ?? 0
  }

  await actualizarStatus({
    estado: 'en_progreso',
    total_estimado: total,
    iniciado_en: new Date(),
    cursor_actual: String(desde)
  })

  const LOTES_VACIOS_MAXIMOS = 3
  let lotesVaciosConsecutivos = 0

  while (procesados < total) {
    const hasta = desde + TAMANIO_LOTE - 1
    const url = `${WINDEV_API}/articulos/inicial/${desde}/${hasta}`

    const response = await fetch(url)
    if (!response.ok) {
      const msg = `Error al llamar a WinDev API (lote ${desde}-${hasta})`
      await actualizarStatus({ estado: 'error', ultimo_error: msg, cursor_actual: String(desde) })
      throw new Error(msg)
    }

    const articulos = await response.json()

    if (articulos.length === 0) {
      lotesVaciosConsecutivos++
      if (lotesVaciosConsecutivos >= LOTES_VACIOS_MAXIMOS) {
        console.warn(`[articulos] ${LOTES_VACIOS_MAXIMOS} lotes vacíos consecutivos. Cortando carga inicial en ${desde}, aunque procesados (${procesados}) < total (${total}). Diferencia probablemente atribuible a bajas.`)
        break
      }
    } else {
      lotesVaciosConsecutivos = 0
    }

    for (const a of articulos) {
      await upsertArticulo(a)
      procesados++
    }

    desde += TAMANIO_LOTE

    await actualizarStatus({
      cursor_actual: String(desde),
      registros_procesados: procesados
    })

    console.log(`[articulos] Lote hasta ${hasta} procesado. Acumulado: ${procesados}/${total}`)
  }

  await actualizarStatus({
    estado: 'completo',
    finalizado_en: new Date(),
    registros_procesados: procesados
  })

  console.log(`[articulos] Carga inicial completa. Total procesados: ${procesados}`)
}

// Sincronización incremental por fecha. Sin paginación: se asume volumen bajo
// de cambios entre corridas (a diferencia de la carga inicial).
export async function cargaIncrementalPorFecha(ultimaFecha) {
  console.log(`[articulos] Sincronización incremental desde ${ultimaFecha.toISOString()}...`)

  const desde = formatearFechaHFSQL(ultimaFecha)
  const url = `${WINDEV_API}/articulos/sync/${desde}`

  const response = await fetch(url)
  if (!response.ok) throw new Error('Error al llamar a WinDev API (incremental artículos)')

  const articulos = await response.json()

  let procesados = 0
  let maxFecha = ultimaFecha

  for (const a of articulos) {
    await upsertArticulo(a)
    procesados++
    const fechaArticulo = new Date(a.fecha_actualizacion)
    if (fechaArticulo > maxFecha) maxFecha = fechaArticulo
  }

  await actualizarStatus({
    estado: 'completo',
    registros_procesados: procesados,
    finalizado_en: new Date()
  })

  console.log(`[articulos] Incremental completo. Sincronizados: ${procesados}`)
  return { sincronizados: procesados, maxFecha }
}

// Punto de entrada único, llamado desde el bootstrap del servidor.
// Decide solo si corresponde carga inicial, retomar una interrumpida, o incremental.
export async function inicializarArticulos() {
  const status = await prisma.compras_sync_status.findUnique({
    where: { proceso: PROCESO }
  })

  if (!status || status.estado === 'pendiente') {
    console.log('[articulos] No hay carga previa registrada. Iniciando carga inicial...')
    await cargaPaginadaPorRango()
  } else if (status.estado === 'en_progreso') {
    console.log(`[articulos] Carga inicial interrumpida en cursor ${status.cursor_actual}. Retomando...`)
    await cargaPaginadaPorRango(status.cursor_actual)
  } else if (status.estado === 'error') {
    console.warn(`[articulos] Última corrida terminó en error: ${status.ultimo_error}. Reintentando desde ${status.cursor_actual ?? '1'}...`)
    await cargaPaginadaPorRango(status.cursor_actual ?? '1')
  } else if (status.estado === 'completo') {
    const maxFecha = await prisma.compras_articulos_cache.aggregate({
      _max: { updated_at_hfsql: true }
    })
    const ultimaFecha = maxFecha._max.updated_at_hfsql ?? new Date(0)
    console.log('[articulos] Carga inicial ya completa. Ejecutando incremental...')
    await cargaIncrementalPorFecha(ultimaFecha)
  }
}