import { randomUUID } from 'node:crypto'
import prisma from '../config/prisma.js'
import {
  consultarOperacionWinDevParaReconciliacion,
  ejecutarOperacionWinDev,
} from '../services/windevClient.js'

// IDs en tributosSubTabla.fic de HFSQL
const TRIBUTO_IVA         = 1
const TRIBUTO_ICL         = 8   // Imp. Combustibles Líquidos (ex-ITC, Ley 27.430)
const TRIBUTO_IDC         = 9   // Imp. Dióxido de Carbono
const TRIBUTO_IMP_INTERNO = 4
const TIMEOUT_TRANSACCION_COMPROBANTE_MS = 40000

class WinDevIntegrationError extends Error {
  constructor(message, { detalle, operacionId, resultado }) {
    super(message)
    this.name = 'WinDevIntegrationError'
    this.detalle = detalle
    this.operacionId = operacionId
    this.resultado = resultado
  }
}
// Percepciones manuales (vienen en body.percepciones[])
// TRIBUTO_IIBB  = 5  → tributo_id en el array
// TRIBUTO_MUNIC = 7  → tributo_id en el array

// =============================================================================
// GET /api/comprobantes/tipos
// =============================================================================
export const getTiposComprobante = async (req, res, next) => {
  try {
    const tipos = await prisma.compras_comprobantes_tipo.findMany({
      orderBy: { id: 'asc' }
    })
    res.json({ ok: true, data: tipos })
  } catch (error) {
    next(error)
  }
}

// =============================================================================
// GET /api/comprobantes/verificar-duplicado
// Query params: proveedor_id, punto_venta, numero_comprobante, comprobante_tipo_id
// =============================================================================
export const verificarDuplicado = async (req, res, next) => {
  try {
    const { proveedor_id, punto_venta, numero_comprobante, comprobante_tipo_id } = req.query

    if (!proveedor_id || !punto_venta || !numero_comprobante || !comprobante_tipo_id) {
      return res.json({ ok: true, duplicado: false })
    }

    const existente = await prisma.compras_comprobantes.findFirst({
      where: {
        proveedor_id:        Number(proveedor_id),
        punto_venta:         Number(punto_venta),
        numero_comprobante:  Number(numero_comprobante),
        comprobante_tipo_id: Number(comprobante_tipo_id),
      },
      select: { id: true }
    })

    res.json({ ok: true, duplicado: !!existente, comprobante_id: existente?.id || null })
  } catch (error) {
    next(error)
  }
}

const eliminarComprobantePendiente = async (comprobanteId) => {
  await prisma.$transaction(async (tx) => {
    await tx.compras_cc_movimientos.deleteMany({
      where: { comprobante_id: comprobanteId },
    })
    await tx.compras_comprobantes.delete({
      where: {
        id: comprobanteId,
        estado_integracion: 'PENDIENTE',
      },
    })
  })
}

// =============================================================================
// GET /api/comprobantes/reconciliar-pendientes
// =============================================================================
export const reconciliarPendientes = async (req, res, next) => {
  try {
    const pendientes = await prisma.compras_comprobantes.findMany({
      where: {
        estado_integracion: 'PENDIENTE',
        operacion_id: { not: null },
      },
      include: {
        compras_proveedores: { select: { razon_social: true } },
        compras_comprobantes_tipo: { select: { descrip_abrev: true } },
      },
      orderBy: { id: 'asc' },
    })

    if (pendientes.length === 0) {
      return res.json({ ok: true, hayPendientes: false, resueltos: [] })
    }

    const WINDEV_URL = process.env.WINDEV_API_URL
    if (!WINDEV_URL) {
      return res.json({
        ok: true,
        hayPendientes: true,
        pendientes: pendientes.map(formatearComprobantePendiente),
        resueltos: [],
      })
    }

    const resueltos = []
    const noResueltos = []

    for (const comprobante of pendientes) {
      const resultado = await consultarOperacionWinDevParaReconciliacion(
        WINDEV_URL,
        comprobante.operacion_id
      )

      if (resultado.estado === 'APLICADA') {
        const resultadoWinDev = resultado.resultado
        const actualizoStock =
          Number(resultadoWinDev?.stockMovId || 0) > 0 ||
          Number(resultadoWinDev?.itemsStockProcesados || 0) > 0

        await prisma.compras_comprobantes.update({
          where: { id: comprobante.id },
          data: {
            estado_integracion: 'APLICADA',
            fecha_actualizacion_stock: actualizoStock ? new Date() : null,
          },
        })
        resueltos.push({ id: comprobante.id, estado: 'APLICADA' })
        continue
      }

      if (resultado.estado === 'ERROR' || resultado.estado === 'NO_ENCONTRADA') {
        await eliminarComprobantePendiente(comprobante.id)
        resueltos.push({ id: comprobante.id, estado: resultado.estado, eliminado: true })
        continue
      }

      noResueltos.push(formatearComprobantePendiente(comprobante))
    }

    res.json({
      ok: true,
      hayPendientes: noResueltos.length > 0,
      pendientes: noResueltos,
      resueltos,
    })
  } catch (error) {
    next(error)
  }
}

const formatearComprobantePendiente = (comprobante) => ({
  id: comprobante.id,
  proveedor: comprobante.compras_proveedores.razon_social,
  tipo: comprobante.compras_comprobantes_tipo.descrip_abrev,
  puntoVenta: comprobante.punto_venta,
  numero: comprobante.numero_comprobante,
  fecha: comprobante.fecha,
  total: comprobante.total,
  operacionID: comprobante.operacion_id,
})

// =============================================================================
// POST /api/comprobantes/registrar
// =============================================================================
export const registrarComprobante = async (req, res, next) => {
  const {
    comprobante_tipo_id,
    proveedor_id,
    punto_venta,
    numero_comprobante,
    fecha,
    fecha_vto,
    subtotal,
    total,
    observaciones,
    usuario_id,
    items             = [],
    percepciones      = [],
    remitos_ids       = [],
    iva_detalle_manual,      // filas IVA desde el pie (simplificado o ajuste manual)
    pie_otros,               // { icl, idc, imp_interno, iibb, munic }
    modo_ingreso,            // 'detallado' | 'simplificado'
    periodo_fiscal,          // 'MM/YYYY' — período de imputación fiscal
  } = req.body

  if (!comprobante_tipo_id || !proveedor_id || !fecha || !usuario_id) {
    return res.status(400).json({
      ok: false,
      error: 'Faltan campos obligatorios: comprobante_tipo_id, proveedor_id, fecha, usuario_id'
    })
  }

  try {
    const tipo = await prisma.compras_comprobantes_tipo.findUnique({
      where: { id: Number(comprobante_tipo_id) }
    })
    if (!tipo) {
      return res.status(400).json({ ok: false, error: 'Tipo de comprobante no encontrado' })
    }

    const esFiscal    = tipo.cbte_fiscal
    const factor      = tipo.factor
    const hfsqlTipoId = tipo.hfsql_comprobante_tipo_id
    const actualizarStock = req.body.actualizar_stock === true
    const depositoId = Number(req.body.deposito_id)
    if (actualizarStock && (!Number.isInteger(depositoId) || depositoId <= 0)) {
      return res.status(400).json({
        ok: false,
        error: 'deposito_id es obligatorio y debe ser un entero positivo cuando se actualiza stock',
      })
    }
    const itemsReales = items.filter(i => Number(i.hfsql_articulos_id) !== -99)
    const hayIntegracionWinDev = itemsReales.length > 0 && (
      actualizarStock || itemsReales.some(i => i.actualizar_costo === true)
    )
    const operacionId = hayIntegracionWinDev ? randomUUID() : null

    let proveedorHfsqlId = null
    if (hayIntegracionWinDev) {
      const proveedor = await prisma.compras_proveedores.findUnique({
        where: { id: Number(proveedor_id) },
        select: { hfsql_proveedores_id: true },
      })
      proveedorHfsqlId = proveedor?.hfsql_proveedores_id
    }
    const WINDEV_URL = process.env.WINDEV_API_URL
    if (hayIntegracionWinDev && (!hfsqlTipoId || !proveedorHfsqlId)) {
      return res.status(502).json({
        ok: false,
        error: 'No se pudo iniciar la integración con WinDev',
        detalle: 'No se encontró la configuración HFSQL del tipo de comprobante o del proveedor',
        operacionID: operacionId,
        estadoIntegracion: 'ERROR',
      })
    }
    if (hayIntegracionWinDev && !WINDEV_URL) {
      return res.status(502).json({
        ok: false,
        error: 'No se pudo iniciar la integración con WinDev',
        detalle: 'La API WinDev no está configurada',
        operacionID: operacionId,
        estadoIntegracion: 'ERROR',
      })
    }

    // ── Subtotal desde líneas o desde body ───────────────────────────────
    const subtotalCalc = items.length > 0
      ? items.reduce((s, i) => s + Number(i.importe_linea || 0), 0)
      : Number(subtotal) || 0

    // ── IVA agrupado: desde iva_detalle_manual (simplificado/ajuste) o desde items
    let ivaFilasParaGrabar = []
    if (iva_detalle_manual && iva_detalle_manual.length > 0) {
      ivaFilasParaGrabar = iva_detalle_manual
        .filter(f => Number(f.importe_iva || 0) > 0)
        .map(f => ({
          iva_tipo_id:    Number(f.iva_tipo_id) || TRIBUTO_IVA,
          alicuota:       Number(f.alicuota),
          base_imponible: Number(f.base_imponible),
          importe_iva:    Number(f.importe_iva),
        }))
    } else {
      // Calcular desde items (modo detallado)
      const map = {}
      for (const i of items) {
        const alicuota  = Number(i.alicuota_iva  || 0)
        const ivaTipoId = Number(i.iva_tipo_id   || TRIBUTO_IVA)
        const iva       = Number(i.importe_iva   || 0)
        if (iva > 0) {
          const key = `${ivaTipoId}|${alicuota}`
          if (!map[key]) map[key] = { iva_tipo_id: ivaTipoId, alicuota, base_imponible: 0, importe_iva: 0 }
          map[key].base_imponible += Number(i.importe_linea || 0)
          map[key].importe_iva    += iva
        }
      }
      ivaFilasParaGrabar = Object.values(map)
    }

    // ── Totales de tributos: desde pie_otros (simplificado) o desde items (detallado)
    const totalIVA    = ivaFilasParaGrabar.reduce((s, f) => s + f.importe_iva, 0)
    const totalICL    = pie_otros ? Number(pie_otros.icl         || 0) : items.reduce((s, i) => s + Number(i.importe_icl         || 0), 0)
    const totalIDC    = pie_otros ? Number(pie_otros.idc         || 0) : items.reduce((s, i) => s + Number(i.importe_idc         || 0), 0)
    const totalImpInt = pie_otros ? Number(pie_otros.imp_interno || 0) : items.reduce((s, i) => s + Number(i.importe_imp_interno || 0), 0)

    // Percepciones manuales
    const totalPercepciones = percepciones.reduce((s, p) => s + Number(p.importe || 0), 0)

    const totalCalc = Number(total) ||
      subtotalCalc + totalIVA + totalICL + totalIDC + totalImpInt + totalPercepciones

    // ── Transacción principal ─────────────────────────────────────────────
    const resultado = await prisma.$transaction(async (tx) => {

      // 1. Cabecera
      const comprobante = await tx.compras_comprobantes.create({
        data: {
          proveedor_id:        Number(proveedor_id),
          comprobante_tipo_id: Number(comprobante_tipo_id),
          punto_venta:         Number(punto_venta) || 0,
          numero_comprobante:  Number(numero_comprobante) || 0,
          fecha:               new Date(fecha),
          fecha_vto:           fecha_vto ? new Date(fecha_vto) : null,
          periodo_fiscal:      periodo_fiscal || null,
          subtotal:            subtotalCalc,
          total:               totalCalc,
          saldo:               totalCalc,
          estado:              'CONFIRMADO',
          operacion_id:        operacionId,
          estado_integracion:  hayIntegracionWinDev ? 'PENDIENTE' : 'NO_REQUIERE',
          observaciones:       observaciones || null,
          usuario_id:          Number(usuario_id),
        }
      })

      // 2. Detalle de líneas
      if (items.length > 0) {
        await tx.compras_comprobantes_detalle.createMany({
          data: items.map(i => ({
            comprobante_id:      comprobante.id,
            hfsql_articulos_id:  Number(i.hfsql_articulos_id),
            articulo_codigo:     i.articulo_codigo || null,
            articulo_descrip:    String(i.articulo_descrip),
            cantidad:            Number(i.cantidad),
            precio_costo:        Number(i.precio_costo),
            importe_linea:       Number(i.importe_linea) || Number(i.cantidad) * Number(i.precio_costo),
            alicuota_iva:        Number(i.alicuota_iva        || 0),
            importe_iva:         Number(i.importe_iva         || 0),
            importe_icl:         Number(i.importe_icl         || 0),
            importe_idc:         Number(i.importe_idc         || 0),
            importe_imp_interno: Number(i.importe_imp_interno || 0),
          }))
        })
      }

      // 3. IVA detalle por alícuota
      if (ivaFilasParaGrabar.length > 0) {
        await tx.compras_comprobantes_iva_detalle.createMany({
          data: ivaFilasParaGrabar.map(f => ({
            comprobante_id: comprobante.id,
            iva_tipo_id:    f.iva_tipo_id || TRIBUTO_IVA,
            alicuota:       f.alicuota,
            base_imponible: f.base_imponible,
            importe_iva:    f.importe_iva,
          }))
        })
      }

      // 4. Tributos (ICL, IDC, Imp.Interno) + percepciones manuales
      const tributoRows = [
        { tributo_id: TRIBUTO_ICL,         importe: totalICL    },
        { tributo_id: TRIBUTO_IDC,         importe: totalIDC    },
        { tributo_id: TRIBUTO_IMP_INTERNO, importe: totalImpInt },
        ...percepciones
          .filter(p => Number(p.importe || 0) > 0)
          .map(p => ({ tributo_id: Number(p.tributo_id), importe: Number(p.importe) })),
      ].filter(r => r.importe > 0)

      if (tributoRows.length > 0) {
        await tx.compras_comprobantes_tributos_detalle.createMany({
          data: tributoRows.map(r => ({
            comprobante_id: comprobante.id,
            tributo_id:     r.tributo_id,
            base_imponible: null,
            importe:        r.importe,
          }))
        })
      }

      // 5. Remitos asociados
      if (remitos_ids.length > 0) {
        await tx.compras_remitos_asociados.createMany({
          data: remitos_ids.map(rid => ({
            comprobante_id: comprobante.id,
            remito_id:      Number(rid),
          }))
        })
      }

      // 6. Movimiento cuenta corriente (solo comprobantes fiscales)
      if (esFiscal) {
        const ultimoMov = await tx.compras_cc_movimientos.findFirst({
          where:   { proveedor_id: Number(proveedor_id) },
          orderBy: { id: 'desc' },
        })
        const saldoAnterior = Number(ultimoMov?.saldo_acumulado || 0)
        const debito        = factor === 1  ? totalCalc : 0
        const credito       = factor === -1 ? totalCalc : 0
        const saldoNuevo    = saldoAnterior + debito - credito

        await tx.compras_cc_movimientos.create({
          data: {
            proveedor_id:    Number(proveedor_id),
            comprobante_id:  comprobante.id,
            pago_id:         null,
            fecha:           new Date(fecha),
            debito,
            credito,
            saldo_acumulado: saldoNuevo,
            descripcion:     `${tipo.descrip_abrev} ${String(punto_venta).padStart(4,'0')}-${String(numero_comprobante).padStart(8,'0')}`,
          }
        })
      }

      let integracion = null
      let comprobanteFinal = comprobante

      if (hayIntegracionWinDev) {
        const payload = {
          operacionID: operacionId,
          tipoOperacion: 'ACTUALIZAR_ARTICULOS_STOCK',
          tipoEntidad: 'COMPROBANTE_COMPRA',
          entidadID: comprobante.id,
          comprobanteTipoId: hfsqlTipoId,
          depositoId: actualizarStock ? depositoId : 0,
          factor,
          usuarioId: Number(usuario_id),
          usuarioNombre: req.body.usuario_nombre || '',
          observaciones: observaciones || `${tipo.descrip_abrev} ${String(punto_venta).padStart(4,'0')}-${String(numero_comprobante).padStart(8,'0')}`,
          puntoVenta: Number(punto_venta) || 0,
          nroComprobante: Number(numero_comprobante) || 0,
          actualizarStock,
          items: itemsReales.map(i => {
            const cantidad = Number(i.cantidad) || 1
            const iclUnit = Number(i.importe_icl || 0) / cantidad
            const idcUnit = Number(i.importe_idc || 0) / cantidad
            const esCombustible = iclUnit > 0 || idcUnit > 0

            return {
              articulosID: Number(i.hfsql_articulos_id),
              descripcion: String(i.articulo_descrip),
              cantidad: Number(i.cantidad),
              precioCosto: Number(i.precio_costo),
              actualizarCosto: i.actualizar_costo === true,
              proveedoresID: Number(proveedorHfsqlId),
              impTransfComb: iclUnit,
              impDioxidoCarbono: idcUnit,
              impInternoMonto: esCombustible
                ? iclUnit + idcUnit
                : Number(i.importe_imp_interno || 0) / cantidad,
              ivaTiposID: Number(i.iva_tipo_id) || 0,
            }
          }),
        }

        integracion = await ejecutarOperacionWinDev({
          windevUrl: WINDEV_URL,
          endpoint: '/apicompras/comprobantes/actualizar-articulos-stock',
          operacionId,
          payload,
        })

        if (integracion.estado === 'ERROR') {
          throw new WinDevIntegrationError(
            'WinDev rechazó la actualización de artículos y stock',
            {
              detalle: integracion.error,
              operacionId,
              resultado: integracion.resultado,
            }
          )
        }

        if (integracion.estado === 'APLICADA') {
          comprobanteFinal = await tx.compras_comprobantes.update({
            where: { id: comprobante.id },
            data: {
              estado_integracion: 'APLICADA',
              fecha_actualizacion_stock: actualizarStock ? new Date() : null,
            },
          })
        }
      }

      return {
        comprobante: comprobanteFinal,
        integracion,
        estadoIntegracion: hayIntegracionWinDev
          ? integracion.estado === 'APLICADA' ? 'APLICADA' : 'PENDIENTE'
          : 'NO_REQUIERE',
      }
    }, { timeout: TIMEOUT_TRANSACCION_COMPROBANTE_MS }) // fin $transaction

    // ── Respuesta ─────────────────────────────────────────────────────────
    const comprobanteRespuesta = {
      id: resultado.comprobante.id,
      comprobante_tipo: tipo.descrip_abrev,
      total: totalCalc,
      saldo: totalCalc,
      estado: 'CONFIRMADO',
    }

    if (resultado.estadoIntegracion === 'PENDIENTE') {
      return res.status(202).json({
        ok: true,
        registrado: true,
        comprobante: comprobanteRespuesta,
        operacionID: operacionId,
        estadoIntegracion: 'PENDIENTE',
        mensaje: 'El comprobante fue registrado, pero la integración no pudo confirmarse',
      })
    }

    res.status(201).json({
      ok: true,
      comprobante: comprobanteRespuesta,
      operacionID: operacionId || undefined,
      estadoIntegracion: resultado.estadoIntegracion,
      resultadoIntegracion: resultado.integracion?.resultado,
    })

  } catch (error) {
    if (error instanceof WinDevIntegrationError) {
      return res.status(502).json({
        ok: false,
        error: error.message,
        detalle: error.detalle,
        estadoIntegracion: 'ERROR',
        operacionID: error.operacionId,
        resultadoIntegracion: error.resultado,
      })
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        ok:    false,
        error: 'Comprobante duplicado (mismo proveedor, punto de venta y número)'
      })
    }
    next(error)
  }
}
