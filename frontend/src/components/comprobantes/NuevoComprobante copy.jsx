import { useState, useEffect } from 'react'
import { NumericFormat } from 'react-number-format'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const CATEGORIAS = {
  'Factura':         (t) => t.descrip_abrev.startsWith('Fac'),
  'Nota de Débito':  (t) => t.descrip_abrev.startsWith('ND') && t.cbte_fiscal,
  'Nota de Crédito': (t) => t.descrip_abrev.startsWith('NC') && t.cbte_fiscal,
  'Remito':          (t) => t.descrip_abrev === 'REM',
  'Nota Interna':    (t) => !t.cbte_fiscal && t.descrip_abrev !== 'REM',
}

const CON_ITEMS = ['Factura', 'Nota de Crédito', 'Remito']

// ─── Formateo display ─────────────────────────────────────────────────────────
const fmt3 = (n) => Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const fmt2 = (n) => Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ─── Período fiscal ───────────────────────────────────────────────────────────
// Genera las 3 opciones: mes actual + 2 anteriores, formato MM/YYYY
const generarOpcionesPeriodo = () => {
  const hoy = new Date()
  const opciones = []
  for (let i = 0; i < 3; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const mm   = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    opciones.push(`${mm}/${yyyy}`)
  }
  return opciones
}

// Dado una fecha 'YYYY-MM-DD', resuelve el periodo fiscal a autocomplete:
// - Si está dentro de los 2 meses anteriores al mes actual → retorna 'MM/YYYY'
// - Si es más antigua → retorna '' (operador debe elegir)
const resolverPeriodoFiscal = (fechaStr) => {
  if (!fechaStr) return ''
  const [yyyy, mm] = fechaStr.split('-').map(Number)
  const fechaDate  = new Date(yyyy, mm - 1, 1)
  const hoy        = new Date()
  const limiteAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1)
  if (fechaDate >= limiteAnterior) {
    return `${String(mm).padStart(2, '0')}/${yyyy}`
  }
  return ''
}

// ─── Conversión segura ────────────────────────────────────────────────────────
const toNum = (v) => {
  if (typeof v === 'number') return isFinite(v) ? v : 0
  if (!v && v !== 0) return 0
  const n = parseFloat(String(v).replace(',', '.'))
  return isFinite(n) ? n : 0
}

// ─── Cálculo de línea ─────────────────────────────────────────────────────────
const calcularImportesLinea = (item) => {
  const cant     = toNum(item.cantidad)
  const costo    = toNum(item.precio_costo)
  const neto     = Math.round(cant * costo * 1000) / 1000
  const icl_unit = toNum(item.icl_unit)
  const idc_unit = toNum(item.idc_unit)
  const esComb   = icl_unit > 0 || idc_unit > 0
  return {
    importe_linea:       neto,
    importe_iva:         Math.round(neto * toNum(item.alicuota_iva) / 100 * 1000) / 1000,
    importe_icl:         Math.round(icl_unit * cant * 1000) / 1000,
    importe_idc:         Math.round(idc_unit * cant * 1000) / 1000,
    importe_imp_interno: esComb
      ? Math.round((icl_unit + idc_unit) * cant * 1000) / 1000
      : Math.round(toNum(item.imp_interno_monto) * cant * 1000) / 1000,
  }
}

// ─── IVA agrupado desde items ─────────────────────────────────────────────────
const calcularIvaAgrupado = (items) => {
  const map = {}
  for (const i of items) {
    const alic   = toNum(i.alicuota_iva)
    const ivaTid = String(i.iva_tipo_id ?? '')
    const iva    = toNum(i.importe_iva)
    if (iva > 0) {
      const key = `${ivaTid}|${alic}`
      if (!map[key]) map[key] = { base: 0, monto: 0, alicuota: alic, iva_tipo_id: ivaTid }
      map[key].base  += toNum(i.importe_linea)
      map[key].monto += iva
    }
  }
  return Object.values(map).map(v => ({
    _uid:           `iva-${v.iva_tipo_id}-${v.alicuota}`,
    iva_tipo_id:    v.iva_tipo_id,
    alicuota:       v.alicuota,
    base_imponible: v.base,
    importe_iva:    v.monto,
  }))
}

// ─── Estado inicial pie ───────────────────────────────────────────────────────
const PIE_OTROS_INICIAL = { icl: 0, idc: 0, imp_interno: 0, iibb: 0, munic: 0 }

// ─── UID único por fila ───────────────────────────────────────────────────────
let uidCounter = 0
const nextUid = () => `row-${++uidCounter}-${Date.now()}`

// ─── Componente NumericFormat para inputs de grilla/pie ──────────────────────
const NumInput = ({ value, onValueChange, className, placeholder = '0,000' }) => (
  <NumericFormat
    value={value}
    thousandSeparator="."
    decimalSeparator=","
    decimalScale={3}
    allowNegative={false}
    onValueChange={onValueChange}
    placeholder={placeholder}
    className={className}
  />
)

// =============================================================================
export default function NuevoComprobante({ onCancelar }) {

  // ── Tipo / cabecera ──────────────────────────────────────────────────────────
  const [tiposTodos, setTiposTodos]         = useState([])
  const [categoria, setCategoria]           = useState('')
  const [tipoId, setTipoId]                 = useState('')
  const [proveedores, setProveedores]       = useState([])
  const [proveedorId, setProveedorId]       = useState('')
  const [puntoVenta, setPuntoVenta]         = useState('')
  const [nroComprobante, setNroComprobante] = useState('')
  const [fecha, setFecha]                   = useState('')
  const [fechaVto, setFechaVto]             = useState('')
  const [periodoFiscal, setPeriodoFiscal]   = useState('')

  // ── Tipos de IVA ─────────────────────────────────────────────────────────────
  const [tiposIva, setTiposIva] = useState([])

  // ── Modo ingreso ─────────────────────────────────────────────────────────────
  const [modoIngreso, setModoIngreso] = useState('detallado')

  // ── Ítems ────────────────────────────────────────────────────────────────────
  const [items, setItems] = useState([])

  // ── Pie IVA filas ────────────────────────────────────────────────────────────
  const [ivaFilas, setIvaFilas] = useState([])

  // ── Pie Otros Tributos (solo editables: iibb, munic, imp_interno simplificado)
  const [pieOtros, setPieOtros] = useState({ ...PIE_OTROS_INICIAL })

  // ── Total manual ─────────────────────────────────────────────────────────────
  const [totalManual, setTotalManual] = useState(0)

  // ── Pie nota interna / ND ────────────────────────────────────────────────────
  const [motivo, setMotivo]           = useState('')
  const [importeTotal, setImporteTotal] = useState(0)

  // ── Stock ────────────────────────────────────────────────────────────────────
  const [actualizarStock, setActualizarStock]     = useState(false)
  const [sucursales, setSucursales]               = useState([])
  const [sucursalId, setSucursalId]               = useState('')
  const [depositos, setDepositos]                 = useState([])
  const [depositoId, setDepositoId]               = useState('')
  const [cargandoDepositos, setCargandoDepositos] = useState(false)

  // ── Validación ───────────────────────────────────────────────────────────────
  const [errores, setErrores] = useState({})

  // ── UI ───────────────────────────────────────────────────────────────────────
  const [cargando, setCargando] = useState(false)

  // ── Columnas sticky ──────────────────────────────────────────────────────────
  const [colsVisibles, setColsVisibles] = useState({ icl: false, idc: false, impInt: false })

  // ── Derivados ────────────────────────────────────────────────────────────────
  const tiposFiltrados   = tiposTodos.filter(t => categoria && CATEGORIAS[categoria]?.(t))
  const tipoSeleccionado = tiposTodos.find(t => t.id === Number(tipoId))
  const llevaItems       = CON_ITEMS.includes(categoria)

  const tieneICL    = items.some(i => toNum(i.icl_unit) > 0)
  const tieneIDC    = items.some(i => toNum(i.idc_unit) > 0)
  const tieneImpInt = items.some(i => toNum(i.importe_imp_interno) > 0)

  useEffect(() => {
    setColsVisibles(prev => ({
      icl:    prev.icl    || tieneICL,
      idc:    prev.idc    || tieneIDC,
      impInt: prev.impInt || tieneImpInt,
    }))
  }, [tieneICL, tieneIDC, tieneImpInt])

  useEffect(() => {
    if (items.length === 0) setColsVisibles({ icl: false, idc: false, impInt: false })
  }, [items.length])

  const mostrarICL    = colsVisibles.icl
  const mostrarIDC    = colsVisibles.idc
  const mostrarImpInt = colsVisibles.impInt
  const hayItemsReales = items.some(i => Number(i.hfsql_articulos_id) !== -99)

  // ── Totales desde items ───────────────────────────────────────────────────────
  const subtotalNeto    = items.reduce((s, i) => s + toNum(i.importe_linea), 0)
  const totalICL_det    = items.reduce((s, i) => s + toNum(i.importe_icl), 0)
  const totalIDC_det    = items.reduce((s, i) => s + toNum(i.importe_idc), 0)
  const totalImpInt_det = items.reduce((s, i) => s + toNum(i.importe_imp_interno), 0)

  // ── ICL/IDC/ImpInterno del pie: derivados en detallado, editables en simplificado
  const pieICL = modoIngreso === 'detallado' ? totalICL_det : toNum(pieOtros.icl)
  const pieIDC = modoIngreso === 'detallado' ? totalIDC_det : toNum(pieOtros.idc)
  const pieImpInternoCalculado = (pieICL + pieIDC) > 0
  const pieImpInterno = modoIngreso === 'detallado'
    ? (pieImpInternoCalculado ? pieICL + pieIDC : totalImpInt_det)
    : (pieImpInternoCalculado ? pieICL + pieIDC : toNum(pieOtros.imp_interno))

  // ── Totales del pie ───────────────────────────────────────────────────────────
  const totalIvaFilas  = ivaFilas.reduce((s, f) => s + toNum(f.importe_iva), 0)
  const totalBaseFilas = ivaFilas.reduce((s, f) => s + toNum(f.base_imponible), 0)
  const totalICLIDC    = pieICL + pieIDC
  const sumaCalculada  = totalBaseFilas + totalIvaFilas + totalICLIDC +
    (pieImpInternoCalculado ? 0 : pieImpInterno) +
    toNum(pieOtros.iibb) + toNum(pieOtros.munic)

  const diferencia = totalManual > 0 ? totalManual - sumaCalculada : null

  // ── Sincronizar ivaFilas con items (detallado) ────────────────────────────────
  useEffect(() => {
    if (modoIngreso === 'detallado' && llevaItems) {
      setIvaFilas(calcularIvaAgrupado(items))
    }
  }, [items, modoIngreso, llevaItems])

  // ── Carga inicial ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/comprobantes/tipos`).then(r => r.json()).then(d => setTiposTodos(d.data || []))
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/proveedores`).then(r => r.json()).then(d => setProveedores(d.data || []))
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/iva-tipos`).then(r => r.json()).then(d => setTiposIva(d.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!actualizarStock || sucursales.length > 0) return
    fetch(`${API_URL}/sucursales`).then(r => r.json()).then(d => setSucursales(d.data || [])).catch(() => {})
  }, [actualizarStock])

  useEffect(() => {
    if (!sucursalId) { setDepositos([]); setDepositoId(''); return }
    setCargandoDepositos(true)
    fetch(`${API_URL}/sucursales/depositos/${sucursalId}`)
      .then(r => r.json())
      .then(d => {
        const lista = d.data || []
        setDepositos(lista)
        if (lista.length === 1) setDepositoId(String(lista[0].id))
        else setDepositoId('')
      })
      .catch(() => {})
      .finally(() => setCargandoDepositos(false))
  }, [sucursalId])

  // ── Reset ────────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setItems([])
    setIvaFilas([])
    setPieOtros({ ...PIE_OTROS_INICIAL })
    setTotalManual(0)
    setFecha('')
    setFechaVto('')
    setPeriodoFiscal('')
    setErrores({})
  }

  const handleCategoriaChange = (e) => {
    setCategoria(e.target.value)
    setTipoId('')
    setModoIngreso('detallado')
    resetForm()
  }

  // ── Toggle modo con advertencia ───────────────────────────────────────────────
  const handleCambiarModo = (modo) => {
    if (modo === modoIngreso) return
    if (items.length > 0) {
      if (!window.confirm('Cambiar de modo borrará todos los ítems ingresados. ¿Confirmás?')) return
    }
    setModoIngreso(modo)
    resetForm()
    if (modo === 'simplificado' && tiposIva.length > 0) {
      const td = tiposIva[0]
      setIvaFilas([{ _uid: nextUid(), iva_tipo_id: String(td.ivaTiposID), alicuota: toNum(td.alicuota), base_imponible: 0, importe_iva: 0 }])
    }
  }

  // ── Actualizar ítem ───────────────────────────────────────────────────────────
  const updateItem = (idx, campo, valor) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it
      const updated = { ...it, [campo]: valor }
      if (['cantidad', 'precio_costo', 'icl_unit', 'idc_unit', 'iva_tipo_id'].includes(campo)) {
        if (campo === 'iva_tipo_id') {
          const tipo = tiposIva.find(t => String(t.ivaTiposID) === String(valor))
          if (tipo) updated.alicuota_iva = toNum(tipo.alicuota)
        }
        return { ...updated, ...calcularImportesLinea(updated) }
      }
      return updated
    }))
  }

  const recalcularItem = (idx) => {
    setItems(prev => prev.map((it, i) => i !== idx ? it : { ...it, ...calcularImportesLinea(it) }))
  }

  // ── Concepto manual ───────────────────────────────────────────────────────────
  const agregarConceptoManual = () => {
    const td = tiposIva.find(t => Math.abs(toNum(t.alicuota) - 21) < 0.01) || tiposIva[0] || { ivaTiposID: '', alicuota: 21 }
    const base = {
      hfsql_articulos_id: -99, descripcion: '', cod_barras: null,
      cantidad: 1, precio_costo_original: 0, precio_costo: 0,
      actualizar_costo: false,
      iva_tipo_id:       String(td.ivaTiposID),
      alicuota_iva:      toNum(td.alicuota),
      imp_interno_monto: 0, icl_unit: 0, idc_unit: 0,
    }
    setItems(prev => [...prev, { ...base, _uid: nextUid(), ...calcularImportesLinea(base) }])
  }

  // ── IVA filas simplificado ────────────────────────────────────────────────────
  const addIvaFila = () => {
    const td = tiposIva[0] || { ivaTiposID: '', alicuota: 0 }
    setIvaFilas(prev => [...prev, { _uid: nextUid(), iva_tipo_id: String(td.ivaTiposID), alicuota: toNum(td.alicuota), base_imponible: 0, importe_iva: 0 }])
  }

  const updateIvaFila = (idx, campo, valor) => {
    setIvaFilas(prev => prev.map((f, i) => {
      if (i !== idx) return f
      let updated = { ...f, [campo]: valor }
      if (campo === 'iva_tipo_id') {
        const tipo = tiposIva.find(t => String(t.ivaTiposID) === String(valor))
        if (tipo) updated.alicuota = toNum(tipo.alicuota)
        updated.importe_iva = Math.round(toNum(updated.base_imponible) * toNum(updated.alicuota) / 100 * 1000) / 1000
      }
      if (campo === 'base_imponible') {
        updated.importe_iva = Math.round(toNum(valor) * toNum(updated.alicuota) / 100 * 1000) / 1000
      }
      return updated
    }))
  }

  const removeIvaFila = (idx) => {
    if (ivaFilas.length <= 1) return
    setIvaFilas(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Validación ────────────────────────────────────────────────────────────────
  const validar = async () => {
    const errs = {}
    if (!tipoId)      errs.tipoId      = 'Seleccioná el tipo de comprobante'
    if (!proveedorId) errs.proveedorId = 'Seleccioná el proveedor'

    // ── Validaciones de fecha ──────────────────────────────────────────────
    if (!fecha) {
      errs.fecha = 'Ingresá la fecha de emisión'
    } else {
      const hoy      = new Date(); hoy.setHours(0, 0, 0, 0)
      const fEmision = new Date(fecha + 'T00:00:00')
      if (isNaN(fEmision.getTime())) {
        errs.fecha = 'Fecha de emisión inválida'
      } else if (fEmision > hoy) {
        errs.fecha = 'La fecha de emisión no puede ser futura'
      }
    }

    if (categoria === 'Factura') {
      if (!fechaVto) {
        errs.fechaVto = 'Ingresá la fecha de vencimiento'
      } else {
        const fVto     = new Date(fechaVto + 'T00:00:00')
        const fEmision = new Date(fecha    + 'T00:00:00')
        if (isNaN(fVto.getTime())) {
          errs.fechaVto = 'Fecha de vencimiento inválida'
        } else if (fecha && !isNaN(fEmision.getTime()) && fVto < fEmision) {
          errs.fechaVto = 'La fecha de vencimiento no puede ser menor a la de emisión'
        }
      }
    }

    if (tipoSeleccionado?.cbte_fiscal) {
      if (!periodoFiscal)  errs.periodoFiscal  = 'Seleccioná el período fiscal'
      if (!puntoVenta)     errs.puntoVenta     = 'Ingresá el punto de venta'
      if (!nroComprobante) errs.nroComprobante = 'Ingresá el número de comprobante'
    }

    // ── Validación duplicados ──────────────────────────────────────────────
    if (tipoSeleccionado?.cbte_fiscal && tipoId && proveedorId && puntoVenta && nroComprobante && !errs.puntoVenta && !errs.nroComprobante) {
      try {
        const r = await fetch(`${API_URL}/comprobantes/verificar-duplicado?proveedor_id=${proveedorId}&punto_venta=${Number(puntoVenta)}&numero_comprobante=${Number(nroComprobante)}&comprobante_tipo_id=${tipoId}`)
        const d = await r.json()
        if (d.duplicado) {
          const pv  = String(puntoVenta).padStart(5, '0')
          const nro = String(nroComprobante).padStart(8, '0')
          errs.nroComprobante = `Ya existe ${tipoSeleccionado.descrip_abrev} ${pv}-${nro} para este proveedor (#${d.comprobante_id})`
        }
      } catch { /* si falla la verificación, dejamos pasar y Node captura el P2002 */ }
    }

    if (llevaItems) {
      if (modoIngreso === 'detallado') {
        if (items.length === 0) {
          errs.items = 'Agregá al menos un ítem'
        } else {
          // ── Descripción obligatoria en conceptos manuales ────────────────
          const sinDescripcion = items.some(i => Number(i.hfsql_articulos_id) === -99 && !i.descripcion?.trim())
          if (sinDescripcion) errs.items = 'Hay conceptos manuales sin descripción'
          else if (subtotalNeto <= 0) errs.items = 'El subtotal debe ser mayor a cero'
        }
      } else {
        if (totalBaseFilas <= 0) errs.ivaFilas   = 'Ingresá la base imponible del IVA'
        if (totalManual <= 0)    errs.totalManual = 'Ingresá el total de la factura'
      }
    } else {
      if (toNum(importeTotal) <= 0) errs.importeTotal = 'Ingresá el importe total'
    }

    if (actualizarStock && hayItemsReales) {
      if (!sucursalId) errs.sucursalId = 'Seleccioná la sucursal'
      if (!depositoId) errs.depositoId = 'Seleccioná el depósito'
    }

    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  // ── REGISTRAR ─────────────────────────────────────────────────────────────────
  const handleConfirmar = async () => {
    if (!await validar()) return
    setCargando(true)
    try {
      let subtotal, total, itemsBody, percepcionesBody, ivaDetalleBody

      if (llevaItems && modoIngreso === 'detallado') {
        subtotal         = subtotalNeto
        total            = totalManual > 0 ? totalManual : sumaCalculada
        itemsBody        = items.map(i => ({
          hfsql_articulos_id:  i.hfsql_articulos_id,
          articulo_codigo:     i.cod_barras || null,
          articulo_descrip:    i.descripcion,
          cantidad:            toNum(i.cantidad),
          precio_costo:        toNum(i.precio_costo),
          importe_linea:       toNum(i.importe_linea),
          iva_tipo_id:         i.iva_tipo_id || null,
          alicuota_iva:        toNum(i.alicuota_iva),
          importe_iva:         toNum(i.importe_iva),
          importe_icl:         toNum(i.importe_icl),
          importe_idc:         toNum(i.importe_idc),
          importe_imp_interno: toNum(i.importe_imp_interno),
          actualizar_costo:    i.actualizar_costo,
        }))
        percepcionesBody = [
          toNum(pieOtros.iibb)  > 0 ? { tributo_id: 5, importe: toNum(pieOtros.iibb)  } : null,
          toNum(pieOtros.munic) > 0 ? { tributo_id: 7, importe: toNum(pieOtros.munic) } : null,
        ].filter(Boolean)
        ivaDetalleBody = ivaFilas.filter(f => toNum(f.importe_iva) > 0)

      } else if (llevaItems && modoIngreso === 'simplificado') {
        subtotal         = totalBaseFilas
        total            = totalManual > 0 ? totalManual : sumaCalculada
        itemsBody        = []
        percepcionesBody = [
          toNum(pieOtros.iibb)  > 0 ? { tributo_id: 5, importe: toNum(pieOtros.iibb)  } : null,
          toNum(pieOtros.munic) > 0 ? { tributo_id: 7, importe: toNum(pieOtros.munic) } : null,
        ].filter(Boolean)
        ivaDetalleBody = ivaFilas.filter(f => toNum(f.importe_iva) > 0)

      } else {
        subtotal         = toNum(importeTotal)
        total            = toNum(importeTotal)
        itemsBody        = []
        percepcionesBody = []
        ivaDetalleBody   = []
      }

      const body = {
        comprobante_tipo_id: Number(tipoId),
        proveedor_id:        Number(proveedorId),
        punto_venta:         Number(puntoVenta)     || 0,
        numero_comprobante:  Number(nroComprobante) || 0,
        fecha,
        fecha_vto:           fechaVto || null,
        periodo_fiscal:      periodoFiscal || null,
        subtotal,
        total,
        observaciones:       motivo || null,
        usuario_id:          1,
        usuario_nombre:      'Operador',
        items:               itemsBody,
        percepciones:        percepcionesBody,
        iva_detalle_manual:  ivaDetalleBody,
        pie_otros: {
          icl:         pieICL,
          idc:         pieIDC,
          imp_interno: pieImpInterno,
          iibb:        toNum(pieOtros.iibb),
          munic:       toNum(pieOtros.munic),
        },
        modo_ingreso:     modoIngreso,
        actualizar_stock: actualizarStock && hayItemsReales,
        deposito_id:      depositoId ? Number(depositoId) : null,
        remitos_ids:      [],
      }

      const res  = await fetch(`${API_URL}/comprobantes/registrar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok || !data.ok) {
        alert(data.error || 'Error al registrar el comprobante')
        return
      }

      alert(`Comprobante #${data.data.id} registrado. Total: $${Number(data.data.total).toLocaleString('es-AR', { minimumFractionDigits: 3 })}`)
      onCancelar()

    } catch (err) {
      alert('Error de conexión: ' + err.message)
    } finally {
      setCargando(false)
    }
  }

  // ── helpers UI ───────────────────────────────────────────────────────────────
  const inputCls = (err) =>
    `w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${err ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`

  const gridInputCls = (err) =>
    `w-full border rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 ${err ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`

  const ErrMsg = ({ campo }) => errores[campo]
    ? <p className="text-red-500 text-xs mt-0.5">{errores[campo]}</p>
    : null

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">Nuevo Comprobante</h2>
        <button onClick={onCancelar} className="text-sm text-gray-500 hover:text-gray-700">✕ Cancelar</button>
      </div>

      <div className="p-6 space-y-6">

        {/* ── ZONA 1 — Tipo ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de comprobante</label>
            <select value={categoria} onChange={handleCategoriaChange} className={inputCls(errores.tipoId)}>
              <option value="">— Seleccioná un tipo —</option>
              {Object.keys(CATEGORIAS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <ErrMsg campo="tipoId" />
          </div>

          {tiposFiltrados.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Letra</label>
              <select value={tipoId} onChange={e => setTipoId(e.target.value)} className={inputCls(errores.tipoId)}>
                <option value="">— Letra —</option>
                {tiposFiltrados.map(t => <option key={t.id} value={t.id}>{t.letra} — {t.descripcion}</option>)}
              </select>
              {tipoSeleccionado?.letra === 'B' && (
                <p className="text-amber-600 text-xs mt-1">
                  ⚠ Las Facturas B no discriminan impuestos y no son válidas para el Libro IVA Compras. Se recomienda no registrarlas.
                </p>
              )}
            </div>
          )}
          {tiposFiltrados.length === 1 && tipoId !== String(tiposFiltrados[0].id) && (
            <div className="hidden">{(() => { setTipoId(String(tiposFiltrados[0].id)); return null })()}</div>
          )}
        </div>

        {/* ── ZONA 2 — Cabecera ──────────────────────────────────────────────── */}
        {(tipoId || tiposFiltrados.length === 1) && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Proveedor</label>
              <select value={proveedorId} onChange={e => setProveedorId(e.target.value)} className={inputCls(errores.proveedorId)}>
                <option value="">— Seleccioná un proveedor —</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
              </select>
              <ErrMsg campo="proveedorId" />
            </div>

            {tipoSeleccionado?.cbte_fiscal && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Punto de venta</label>
                  <input type="text" value={puntoVenta}
                    onChange={e => setPuntoVenta(e.target.value.replace(/\D/g, ''))}
                    onBlur={e => { if (e.target.value) setPuntoVenta(e.target.value.padStart(5, '0')) }}
                    placeholder="00001" className={inputCls(errores.puntoVenta)} />
                  <ErrMsg campo="puntoVenta" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Número</label>
                  <input type="text" value={nroComprobante}
                    onChange={e => setNroComprobante(e.target.value.replace(/\D/g, ''))}
                    onBlur={e => { if (e.target.value) setNroComprobante(e.target.value.padStart(8, '0')) }}
                    placeholder="00000001" className={inputCls(errores.nroComprobante)} />
                  <ErrMsg campo="nroComprobante" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Fecha de emisión</label>
              <input type="date" value={fecha}
                onChange={e => {
                  const v = e.target.value
                  setFecha(v)
                  setErrores(prev => ({ ...prev, fecha: undefined, fechaVto: undefined }))
                  // Autocomplete período fiscal
                  if (tipoSeleccionado?.cbte_fiscal) {
                    setPeriodoFiscal(resolverPeriodoFiscal(v))
                  } else {
                    // No fiscal: autocomplete siempre con el mes de la fecha
                    if (v) {
                      const [yyyy, mm] = v.split('-')
                      setPeriodoFiscal(`${mm}/${yyyy}`)
                    }
                  }
                }}
                className={inputCls(errores.fecha)} />
              <ErrMsg campo="fecha" />
            </div>

            {categoria === 'Factura' && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Fecha de vencimiento</label>
                <input type="date" value={fechaVto}
                  onChange={e => { setFechaVto(e.target.value); setErrores(prev => ({ ...prev, fechaVto: undefined })) }}
                  className={inputCls(errores.fechaVto)} />
                <ErrMsg campo="fechaVto" />
              </div>
            )}

            {/* Período fiscal — solo para comprobantes fiscales */}
            {tipoSeleccionado?.cbte_fiscal && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Período fiscal</label>
                <select value={periodoFiscal}
                  onChange={e => { setPeriodoFiscal(e.target.value); setErrores(prev => ({ ...prev, periodoFiscal: undefined })) }}
                  className={inputCls(errores.periodoFiscal)}>
                  <option value="">— Seleccioná el período —</option>
                  {generarOpcionesPeriodo().map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ErrMsg campo="periodoFiscal" />
              </div>
            )}
          </div>
        )}

        {/* ── ZONA 3 — Items ─────────────────────────────────────────────────── */}
        {proveedorId && llevaItems && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Ítems</h3>
              <div className="flex rounded border border-gray-300 overflow-hidden text-xs">
                <button onClick={() => handleCambiarModo('detallado')}
                  className={`px-3 py-1.5 font-medium transition-colors ${modoIngreso === 'detallado' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  Detallado
                </button>
                <button onClick={() => handleCambiarModo('simplificado')}
                  className={`px-3 py-1.5 font-medium border-l border-gray-300 transition-colors ${modoIngreso === 'simplificado' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  Simplificado
                </button>
              </div>
            </div>

            {/* DETALLADO */}
            {modoIngreso === 'detallado' && (
              <>
                <BuscadorArticulos proveedorId={proveedorId}
                  onSeleccionar={(articulo) => {
                    const base = {
                      hfsql_articulos_id:    articulo.articulos_id,
                      descripcion:           articulo.descripcion,
                      cod_barras:            articulo.cod_barras,
                      cantidad:              1,
                      precio_costo_original: articulo.precio_costo,
                      precio_costo:          articulo.precio_costo_proveedor || articulo.precio_costo || 0,
                      actualizar_costo:      true,
                      iva_tipo_id:           String(
                        articulo.IvaTiposID ??
                        articulo.iva_tipos_id ??
                        tiposIva.find(t => toNum(t.alicuota) === toNum(articulo.alicuota_iva))?.ivaTiposID ??
                        ''
                      ),
                      alicuota_iva:          toNum(articulo.alicuota_iva),
                      imp_interno_monto:     toNum(articulo.imp_interno_monto),
                      icl_unit:              toNum(articulo.imp_transf_comb),
                      idc_unit:              toNum(articulo.imp_dioxido_carbono),
                    }
                    setItems(prev => [...prev, { ...base, _uid: nextUid(), ...calcularImportesLinea(base) }])
                    setErrores(prev => ({ ...prev, items: undefined }))
                  }}
                />
                <button onClick={agregarConceptoManual}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline">
                  ＋ Agregar concepto manual
                </button>
                <ErrMsg campo="items" />

                {items.length > 0 && (
                  <div className="overflow-x-auto mt-3">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left   text-gray-600 font-medium">Artículo</th>
                          <th className="px-3 py-2 text-center text-gray-600 font-medium w-28">Cant.</th>
                          <th className="px-3 py-2 text-right  text-gray-600 font-medium w-28">Costo act.</th>
                          <th className="px-3 py-2 text-right  text-gray-600 font-medium w-28">Costo fact.</th>
                          <th className="px-3 py-2 text-center text-gray-600 font-medium w-36">Tipo IVA</th>
                          <th className="px-3 py-2 text-right  text-gray-600 font-medium w-28">IVA</th>
                          {mostrarICL    && <th className="px-3 py-2 text-right text-gray-600 font-medium w-28">ICL unit.</th>}
                          {mostrarIDC    && <th className="px-3 py-2 text-right text-gray-600 font-medium w-28">IDC unit.</th>}
                          {mostrarImpInt && <th className="px-3 py-2 text-right text-gray-600 font-medium w-28">Imp.Int.</th>}
                          <th className="px-3 py-2 text-center text-gray-600 font-medium w-16">Act.</th>
                          <th className="px-3 py-2 text-right  text-gray-600 font-medium w-32">Importe</th>
                          <th className="px-3 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((item, idx) => {
                          const esManual = Number(item.hfsql_articulos_id) === -99
                          return (
                            <tr key={item._uid} className={`hover:bg-gray-50 ${esManual ? 'bg-amber-50' : ''}`}>

                              {/* Artículo */}
                              <td className="px-3 py-2">
                                {esManual ? (
                                  <input type="text" value={item.descripcion}
                                    onChange={e => updateItem(idx, 'descripcion', e.target.value)}
                                    placeholder="Descripción del concepto..."
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400" />
                                ) : (
                                  <>
                                    <div className="font-medium text-gray-800">{item.descripcion}</div>
                                    {item.cod_barras && <div className="text-xs text-gray-400">{item.cod_barras}</div>}
                                  </>
                                )}
                              </td>

                              {/* Cantidad */}
                              <td className="px-3 py-2">
                                <NumInput value={item.cantidad}
                                  onValueChange={v => updateItem(idx, 'cantidad', v.floatValue ?? 0)}
                                  className={gridInputCls()} />
                              </td>

                              {/* Costo actual */}
                              <td className="px-3 py-2 text-right text-gray-400">
                                {esManual ? '—' : `$ ${fmt3(item.precio_costo_original)}`}
                              </td>

                              {/* Costo factura */}
                              <td className="px-3 py-2">
                                <NumInput value={item.precio_costo}
                                  onValueChange={v => updateItem(idx, 'precio_costo', v.floatValue ?? 0)}
                                  className={gridInputCls()} />
                              </td>

                              {/* Tipo IVA — select para todos */}
                              <td className="px-3 py-2">
                                <select value={String(item.iva_tipo_id || '')}
                                  onChange={e => updateItem(idx, 'iva_tipo_id', e.target.value)}
                                  className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                                  {tiposIva.map(t => (
                                    <option key={t.ivaTiposID} value={String(t.ivaTiposID)}>{t.descripcion}</option>
                                  ))}
                                </select>
                              </td>

                              {/* IVA calculado */}
                              <td className="px-3 py-2 text-right text-gray-700">$ {fmt3(item.importe_iva)}</td>

                              {/* ICL */}
                              {mostrarICL && (
                                <td className="px-3 py-2">
                                  {esManual ? <span className="text-gray-300 text-xs flex justify-center">—</span> : (
                                    <NumInput value={item.icl_unit}
                                      onValueChange={v => updateItem(idx, 'icl_unit', v.floatValue ?? 0)}
                                      className={gridInputCls()} />
                                  )}
                                </td>
                              )}

                              {/* IDC */}
                              {mostrarIDC && (
                                <td className="px-3 py-2">
                                  {esManual ? <span className="text-gray-300 text-xs flex justify-center">—</span> : (
                                    <NumInput value={item.idc_unit}
                                      onValueChange={v => updateItem(idx, 'idc_unit', v.floatValue ?? 0)}
                                      className={gridInputCls()} />
                                  )}
                                </td>
                              )}

                              {/* Imp. Interno */}
                              {mostrarImpInt && (
                                <td className="px-3 py-2 text-right text-gray-700">
                                  {esManual ? '—' : `$ ${fmt3(item.importe_imp_interno)}`}
                                </td>
                              )}

                              {/* Act. costo */}
                              <td className="px-3 py-2 text-center">
                                {esManual ? <span className="text-gray-300 text-xs">—</span> : (
                                  <input type="checkbox" checked={item.actualizar_costo}
                                    onChange={e => updateItem(idx, 'actualizar_costo', e.target.checked)}
                                    className="w-4 h-4 accent-blue-600" />
                                )}
                              </td>

                              {/* Subtotal */}
                              <td className="px-3 py-2 text-right text-gray-700 font-medium">$ {fmt3(item.importe_linea)}</td>

                              {/* Eliminar */}
                              <td className="px-3 py-2">
                                <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-red-400 hover:text-red-600 text-lg leading-none">✕</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* SIMPLIFICADO */}
            {modoIngreso === 'simplificado' && (
              <p className="text-xs text-gray-500 mt-1">Ingresá los totales del pie directamente desde la factura del proveedor.</p>
            )}
          </div>
        )}

        {/* ── ZONA 3B — Nota Interna / ND ────────────────────────────────────── */}
        {proveedorId && !llevaItems && categoria !== '' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Motivo</label>
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
                placeholder="Descripción del ajuste..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-600 mb-1">Importe total</label>
              <NumInput value={importeTotal}
                onValueChange={v => setImporteTotal(v.floatValue ?? 0)}
                className={inputCls(errores.importeTotal)} />
              <ErrMsg campo="importeTotal" />
            </div>
          </div>
        )}

        {/* ── ZONA 4 — Pie ───────────────────────────────────────────────────── */}
        {proveedorId && llevaItems && (items.length > 0 || modoIngreso === 'simplificado') && (
          <div className="border-t border-gray-200 pt-5">
            <div className="grid grid-cols-2 gap-8">

              {/* COLUMNA IZQUIERDA: subtablas */}
              <div className="space-y-5">

                {/* Subtabla IVA */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">IVA</span>
                    {modoIngreso === 'simplificado' && (
                      <button onClick={addIvaFila} className="text-xs text-blue-600 hover:text-blue-800">＋ Agregar alícuota</button>
                    )}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400">
                        <th className="text-left pb-1 font-medium">Base imponible</th>
                        <th className="text-right pb-1 font-medium w-36">Alíc.</th>
                        <th className="text-right pb-1 font-medium w-28">IVA</th>
                        {modoIngreso === 'simplificado' && <th className="w-6"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {ivaFilas.length === 0 && modoIngreso === 'detallado' && (
                        <tr><td colSpan={3} className="text-xs text-gray-400 py-2">Se completará al agregar ítems</td></tr>
                      )}
                      {ivaFilas.map((f, idx) => (
                        <tr key={f._uid}>
                          <td className="py-1 pr-2">
                            {modoIngreso === 'simplificado' ? (
                              <NumInput value={f.base_imponible}
                                onValueChange={v => updateIvaFila(idx, 'base_imponible', v.floatValue ?? 0)}
                                className={gridInputCls(errores.ivaFilas)} />
                            ) : (
                              <span className="text-gray-700">$ {fmt3(f.base_imponible)}</span>
                            )}
                          </td>
                          <td className="py-1 pr-2">
                            {modoIngreso === 'simplificado' ? (
                              <select value={f.iva_tipo_id || ''}
                                onChange={e => updateIvaFila(idx, 'iva_tipo_id', e.target.value)}
                                className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                                {tiposIva.map(t => <option key={t.ivaTiposID} value={t.ivaTiposID}>{t.descripcion}</option>)}
                              </select>
                            ) : (
                              <span className="text-gray-700 text-right block">{fmt2(f.alicuota)}%</span>
                            )}
                          </td>
                          <td className="py-1 text-right">
                            <span className="text-gray-700">$ {fmt3(f.importe_iva)}</span>
                          </td>
                          {modoIngreso === 'simplificado' && (
                            <td className="py-1 pl-1">
                              <button onClick={() => removeIvaFila(idx)}
                                className="text-red-300 hover:text-red-500 text-sm leading-none">✕</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <ErrMsg campo="ivaFilas" />
                </div>

                {/* Subtabla Otros Tributos */}
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Otros tributos</span>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-50">
                      <tr>
                        <td className="py-1 pr-2 text-gray-500 w-40">ICL (ex-ITC)</td>
                        <td className="py-1">
                          {modoIngreso === 'detallado'
                            ? <div className="text-right text-gray-700 pr-2">$ {fmt3(pieICL)}</div>
                            : <NumInput value={pieOtros.icl} onValueChange={v => setPieOtros(p => ({ ...p, icl: v.floatValue ?? 0 }))} className={gridInputCls()} />
                          }
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-2 text-gray-500">IDC</td>
                        <td className="py-1">
                          {modoIngreso === 'detallado'
                            ? <div className="text-right text-gray-700 pr-2">$ {fmt3(pieIDC)}</div>
                            : <NumInput value={pieOtros.idc} onValueChange={v => setPieOtros(p => ({ ...p, idc: v.floatValue ?? 0 }))} className={gridInputCls()} />
                          }
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-2 text-gray-500">Imp. Interno</td>
                        <td className="py-1">
                          {pieImpInternoCalculado || modoIngreso === 'detallado'
                            ? <div className="text-right text-gray-700 pr-2">$ {fmt3(pieImpInterno)}</div>
                            : <NumInput value={pieOtros.imp_interno} onValueChange={v => setPieOtros(p => ({ ...p, imp_interno: v.floatValue ?? 0 }))} className={gridInputCls()} />
                          }
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-2 text-gray-500">Perc. IIBB</td>
                        <td className="py-1">
                          <NumInput value={pieOtros.iibb} onValueChange={v => setPieOtros(p => ({ ...p, iibb: v.floatValue ?? 0 }))} className={gridInputCls()} />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-2 text-gray-500">Perc. Municipales</td>
                        <td className="py-1">
                          <NumInput value={pieOtros.munic} onValueChange={v => setPieOtros(p => ({ ...p, munic: v.floatValue ?? 0 }))} className={gridInputCls()} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* COLUMNA DERECHA: totales */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Neto gravado:</span>
                  <span className="text-gray-800 font-medium">$ {fmt3(totalBaseFilas)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA:</span>
                  <span className="text-gray-700">$ {fmt3(totalIvaFilas)}</span>
                </div>
                {pieImpInterno > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Imp. Interno:</span>
                    <span className="text-gray-700">$ {fmt3(pieImpInterno)}</span>
                  </div>
                )}
                {pieICL > 0 && (
                  <div className="flex justify-between text-xs text-gray-400 pl-3">
                    <span>↳ ICL</span><span>$ {fmt3(pieICL)}</span>
                  </div>
                )}
                {pieIDC > 0 && (
                  <div className="flex justify-between text-xs text-gray-400 pl-3">
                    <span>↳ IDC</span><span>$ {fmt3(pieIDC)}</span>
                  </div>
                )}
                {toNum(pieOtros.iibb) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Perc. IIBB:</span>
                    <span className="text-gray-700">$ {fmt3(pieOtros.iibb)}</span>
                  </div>
                )}
                {toNum(pieOtros.munic) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Perc. Municipales:</span>
                    <span className="text-gray-700">$ {fmt3(pieOtros.munic)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>Suma calculada:</span>
                    <span>$ {fmt3(sumaCalculada)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total factura:</span>
                    <NumInput value={totalManual}
                      onValueChange={v => { setTotalManual(v.floatValue ?? 0); setErrores(p => ({ ...p, totalManual: undefined })) }}
                      className={`w-40 border rounded px-2 py-1 text-right text-sm font-semibold focus:outline-none focus:ring-1 ${errores.totalManual ? 'border-red-400 focus:ring-red-300' : 'border-gray-400 focus:ring-blue-500'}`}
                    />
                  </div>
                  {diferencia !== null && (
                    <div className={`text-right text-xs mt-1 ${Math.abs(diferencia) <= 0.05 ? 'text-green-600' : 'text-amber-600'}`}>
                      {Math.abs(diferencia) <= 0.05 ? '✓ Total verificado' : `Diferencia: $ ${fmt3(diferencia)}`}
                    </div>
                  )}
                  <ErrMsg campo="totalManual" />
                </div>

                {/* Actualizar stock */}
                {modoIngreso === 'detallado' && hayItemsReales && (
                  <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                      <input type="checkbox" checked={actualizarStock}
                        onChange={e => { setActualizarStock(e.target.checked); if (!e.target.checked) { setSucursalId(''); setDepositoId('') } }}
                        className="w-4 h-4 accent-blue-600" />
                      <span className="text-sm text-gray-700 font-medium">Actualizar stock</span>
                    </label>
                    {actualizarStock && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Sucursal</label>
                          <select value={sucursalId} onChange={e => setSucursalId(e.target.value)}
                            className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 ${errores.sucursalId ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`}>
                            <option value="">— Sucursal —</option>
                            {sucursales.map(s => <option key={s.sucursalesID} value={s.sucursalesID}>{s.nombreSucursal}</option>)}
                          </select>
                          <ErrMsg campo="sucursalId" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Depósito</label>
                          <select value={depositoId} onChange={e => setDepositoId(e.target.value)}
                            disabled={!sucursalId || cargandoDepositos}
                            className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 disabled:bg-gray-100 disabled:text-gray-400 ${errores.depositoId ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`}>
                            <option value="">{cargandoDepositos ? 'Cargando...' : '— Depósito —'}</option>
                            {depositos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                          </select>
                          <ErrMsg campo="depositoId" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-3">
                  <button onClick={handleConfirmar} disabled={cargando}
                    className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {cargando ? 'Guardando...' : 'Confirmar comprobante'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pie nota interna / ND */}
        {proveedorId && !llevaItems && toNum(importeTotal) > 0 && (
          <div className="flex justify-between items-center border-t border-gray-200 pt-4">
            <div className="flex items-center">
              <span className="font-semibold text-gray-800 mr-4">Total:</span>
              <span className="font-bold text-gray-900 text-base">$ {fmt3(toNum(importeTotal))}</span>
            </div>
            <button onClick={handleConfirmar} disabled={cargando}
              className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {cargando ? 'Guardando...' : 'Confirmar comprobante'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

// =============================================================================
// BUSCADOR DE ARTÍCULOS
// =============================================================================
function BuscadorArticulos({ proveedorId, onSeleccionar }) {
  const [modo, setModo]             = useState('descripcion')
  const [texto, setTexto]           = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando]     = useState(false)

  const buscar = async () => {
    if (!texto.trim()) return
    setBuscando(true)
    try {
      let url
      if (modo === 'descripcion')  url = `${API_URL}/articulos/por-descripcion/${proveedorId}?texto=${encodeURIComponent(texto)}`
      if (modo === 'codBarras')    url = `${API_URL}/articulos/por-codigo-barras/${proveedorId}/${encodeURIComponent(texto)}`
      if (modo === 'codProveedor') url = `${API_URL}/articulos/por-proveedor/${proveedorId}/${encodeURIComponent(texto)}`
      const res  = await fetch(url)
      const data = await res.json()
      const lista = data.data || []
      if (lista.length === 1) { onSeleccionar(lista[0]); setTexto(''); setResultados([]) }
      else setResultados(lista)
    } finally { setBuscando(false) }
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <select value={modo} onChange={e => { setModo(e.target.value); setResultados([]) }}
          className="border border-gray-300 rounded px-2 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="descripcion">Descripción</option>
          <option value="codBarras">Cód. barras</option>
          <option value="codProveedor">Cód. proveedor</option>
        </select>
        <input type="text" value={texto}
          onChange={e => { setTexto(e.target.value); if (!e.target.value) setResultados([]) }}
          onKeyDown={e => e.key === 'Enter' && buscar()}
          placeholder="Buscar artículo..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus />
        <button onClick={buscar} disabled={buscando || !texto.trim()}
          className="bg-gray-100 border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 disabled:opacity-50">
          {buscando ? '...' : 'Buscar'}
        </button>
      </div>
      {resultados.length > 0 && (
        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-64 overflow-y-auto">
          {resultados.map(a => (
            <button key={a.articulos_id} onClick={() => { onSeleccionar(a); setTexto(''); setResultados([]) }}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0">
              <div className="text-sm font-medium text-gray-800">{a.descripcion}</div>
              <div className="text-xs text-gray-400 flex gap-3">
                {a.cod_barras && <span>CB: {a.cod_barras}</span>}
                <span>Costo: $ {Number(a.precio_costo_proveedor || a.precio_costo).toLocaleString('es-AR', { minimumFractionDigits: 3 })}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
