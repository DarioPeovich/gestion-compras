import prisma from '../config/prisma.js'

// IDs en tributosSubTabla.fic de HFSQL
const TRIBUTO_IVA         = 1
const TRIBUTO_ICL         = 8   // Imp. Combustibles Líquidos (ex-ITC, Ley 27.430)
const TRIBUTO_IDC         = 9   // Imp. Dióxido de Carbono
const TRIBUTO_IMP_INTERNO = 4
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

      return comprobante
    }) // fin $transaction

    // ── WinDev: actualizar costos ─────────────────────────────────────────
    const WINDEV_URL     = process.env.WINDEV_API_URL
    const itemsParaCosto = items.filter(
      i => Number(i.hfsql_articulos_id) !== -99 && i.actualizar_costo
    )
    if (itemsParaCosto.length > 0 && hfsqlTipoId && WINDEV_URL) {
      try {
        await fetch(`${WINDEV_URL}/apicompras/articulos/actualizar-costo`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsParaCosto.map(i => {
              const icl_unit      = Number(i.importe_icl || 0) / (Number(i.cantidad) || 1)
              const idc_unit      = Number(i.importe_idc || 0) / (Number(i.cantidad) || 1)
              const esCombustible = icl_unit > 0 || idc_unit > 0
              return {
                articulosID:       i.hfsql_articulos_id,
                nuevoPrecioCosto:  i.precio_costo,
                proveedoresID:     Number(proveedor_id),
                impTransfComb:     icl_unit,
                impDioxidoCarbono: idc_unit,
                impInternoMonto:   esCombustible
                  ? icl_unit + idc_unit
                  : Number(i.importe_imp_interno || 0) / (Number(i.cantidad) || 1),
                ivaTiposID:        Number(i.iva_tipo_id) || 0,
              }
            })
          })
        })
      } catch (err) {
        console.error('[registrar] Error actualizando costos en WinDev:', err.message)
      }
    }

    // ── WinDev: actualizar stock ──────────────────────────────────────────
    const actualizarStock = req.body.actualizar_stock === true
    const itemsParaStock  = items.filter(i => Number(i.hfsql_articulos_id) !== -99)
    if (actualizarStock && itemsParaStock.length > 0 && hfsqlTipoId && WINDEV_URL) {
      try {
        const resStock = await fetch(`${WINDEV_URL}/apicompras/stock/actualizar`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comprobanteTipoId: hfsqlTipoId,
            depositoId:        Number(req.body.deposito_id),
            factor,
            usuarioId:         Number(usuario_id),
            usuarioNombre:     req.body.usuario_nombre || '',
            observaciones:     `${tipo.descrip_abrev} ${String(punto_venta).padStart(4,'0')}-${String(numero_comprobante).padStart(8,'0')}`,
            puntoVenta:        Number(punto_venta) || 0,
            nroComprobante:    Number(numero_comprobante) || 0,
            items: itemsParaStock.map(i => ({
              articulosID: i.hfsql_articulos_id,
              cantidad:    i.cantidad,
              descripcion: i.articulo_descrip,
              precioCosto: i.precio_costo,
            }))
          })
        })
        if (resStock.ok) {
          await prisma.compras_comprobantes.update({
            where: { id: resultado.id },
            data:  { fecha_actualizacion_stock: new Date() }
          })
        } else {
          console.error('[registrar] WinDev stock respondió:', resStock.status)
        }
      } catch (err) {
        console.error('[registrar] Error actualizando stock en WinDev:', err.message)
      }
    }

    // ── Respuesta ─────────────────────────────────────────────────────────
    res.status(201).json({
      ok:   true,
      data: {
        id:               resultado.id,
        comprobante_tipo: tipo.descrip_abrev,
        total:            totalCalc,
        saldo:            totalCalc,
        estado:           'CONFIRMADO',
      }
    })

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        ok:    false,
        error: 'Comprobante duplicado (mismo proveedor, punto de venta y número)'
      })
    }
    next(error)
  }
}
