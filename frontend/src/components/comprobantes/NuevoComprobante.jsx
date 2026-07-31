import { useState, useEffect } from "react";
import { NumericFormat } from "react-number-format";
import { FileText } from "lucide-react";

import SESWorkspace from "../ui/layout/SESWorkspace";
import SESSection from "../ui/layout/SESSection";
import SESFormRow from "../ui/forms/SESFormRow";
import SESComprobanteSection from "./SESComprobanteSection.jsx";
import SESFooterActions from "./SESFooterActions.jsx";
import SESItemsSection from "./SESItemsSection.jsx";
import SESProveedorSection from "./SESProveedorSection.jsx";
import SESResumenSection from "./SESResumenSection.jsx";
import useSESToast from "../ui/feedback/useSESToast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const CONFIG_CATEGORIAS = {
  Factura: {
    filtroTipo: (t) => t.descrip_abrev.startsWith("FacCmp_"),
    llevaItems: true,
    permiteSimplificado: true,
    esRemito: false,
    encabezado: {
      title: "Nueva factura",
      subtitle: "Recepción y registración de facturas de compra",
    },
    seccionDocumento: {
      title: "Comprobante",
      subtitle: "Tipo, proveedor, numeración, fechas y período fiscal",
    },
  },
  "Nota de Crédito": {
    filtroTipo: (t) => t.descrip_abrev.startsWith("NCCmp_"),
    llevaItems: true,
    permiteSimplificado: true,
    esRemito: false,
    encabezado: {
      title: "Nueva nota de crédito",
      subtitle: "Registración de notas de crédito de proveedores",
    },
    seccionDocumento: {
      title: "Comprobante",
      subtitle: "Tipo, proveedor, numeración, fechas y período fiscal",
    },
  },
  "Nota de Débito": {
    filtroTipo: (t) => t.descrip_abrev.startsWith("NDCmp_"),
    llevaItems: false,
    permiteSimplificado: false,
    esRemito: false,
    encabezado: {
      title: "Nueva nota de débito",
      subtitle: "Registración de notas de débito de proveedores",
    },
    seccionDocumento: {
      title: "Comprobante",
      subtitle: "Tipo, proveedor, numeración, fechas y período fiscal",
    },
  },
  Remito: {
    filtroTipo: (t) => t.descrip_abrev === "RtoCmp",
    llevaItems: true,
    permiteSimplificado: false,
    esRemito: true,
    encabezado: {
      title: "Nuevo remito",
      subtitle: "Recepción de mercadería y actualización de stock",
    },
    seccionDocumento: {
      title: "Datos del remito",
      subtitle: "Proveedor, numeración y fecha de emisión",
    },
  },
  "Nota de Débito Interna": {
    filtroTipo: (t) => t.descrip_abrev === "NDInt_Cmp",
    llevaItems: false,
    permiteSimplificado: false,
    esRemito: false,
    encabezado: {
      title: "Nueva nota de débito interna",
      subtitle: "Registración de ajustes internos de débito",
    },
    seccionDocumento: {
      title: "Comprobante",
      subtitle: "Tipo, proveedor, numeración, fechas y período fiscal",
    },
  },
  "Nota de Crédito Interna": {
    filtroTipo: (t) => t.descrip_abrev === "NCInt_Cmp",
    llevaItems: false,
    permiteSimplificado: false,
    esRemito: false,
    encabezado: {
      title: "Nueva nota de crédito interna",
      subtitle: "Registración de ajustes internos de crédito",
    },
    seccionDocumento: {
      title: "Comprobante",
      subtitle: "Tipo, proveedor, numeración, fechas y período fiscal",
    },
  },
};

const CONFIG_CATEGORIA_INICIAL = {
  llevaItems: false,
  permiteSimplificado: false,
  esRemito: false,
  encabezado: {
    title: "Nuevo comprobante",
    subtitle: "Recepción y registración de comprobantes de compra",
  },
  seccionDocumento: {
    title: "Comprobante",
    subtitle: "Tipo, proveedor, numeración, fechas y período fiscal",
  },
};

// ─── Formateo display ─────────────────────────────────────────────────────────
const fmt3 = (n) =>
  Number(n || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
const fmt2 = (n) =>
  Number(n || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ─── Período fiscal ───────────────────────────────────────────────────────────
// Genera las 3 opciones: mes actual + 2 anteriores, formato MM/YYYY
const generarOpcionesPeriodo = () => {
  const hoy = new Date();
  const opciones = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    opciones.push(`${mm}/${yyyy}`);
  }
  return opciones;
};

// Dado una fecha 'YYYY-MM-DD', resuelve el periodo fiscal a autocomplete:
// - Si está dentro de los 2 meses anteriores al mes actual → retorna 'MM/YYYY'
// - Si es más antigua → retorna '' (operador debe elegir)
const resolverPeriodoFiscal = (fechaStr) => {
  if (!fechaStr) return "";
  const [yyyy, mm] = fechaStr.split("-").map(Number);
  const fechaDate = new Date(yyyy, mm - 1, 1);
  const hoy = new Date();
  const limiteAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
  if (fechaDate >= limiteAnterior) {
    return `${String(mm).padStart(2, "0")}/${yyyy}`;
  }
  return "";
};

// ─── Conversión segura ────────────────────────────────────────────────────────
const toNum = (v) => {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (!v && v !== 0) return 0;
  const n = parseFloat(String(v).replace(",", "."));
  return isFinite(n) ? n : 0;
};

const resolverCodigoArticulo = (item) => {
  const candidatos = [
    item.articulo_codigo,
    item.cod_ses,
    item.cod_proveedor,
    item.cod_barras,
  ];
  const codigo = candidatos.find((valor) => String(valor ?? "").trim());
  return codigo == null ? "" : String(codigo).trim();
};

// ─── Cálculo de línea ─────────────────────────────────────────────────────────
const calcularImportesLinea = (item) => {
  const cant = toNum(item.cantidad);
  const costo = toNum(item.precio_costo);
  const neto = Math.round(cant * costo * 1000) / 1000;
  const icl_unit = toNum(item.icl_unit);
  const idc_unit = toNum(item.idc_unit);
  const imp_interno_unit = toNum(item.imp_interno_monto);
  const esCombustible = item.es_combustible === true;
  return {
    importe_linea: neto,
    importe_iva: Math.round(((neto * toNum(item.alicuota_iva)) / 100) * 1000) / 1000,
    importe_icl: esCombustible ? Math.round(icl_unit * cant * 1000) / 1000 : 0,
    importe_idc: esCombustible ? Math.round(idc_unit * cant * 1000) / 1000 : 0,
    importe_imp_interno: esCombustible
      ? Math.round((icl_unit + idc_unit) * cant * 1000) / 1000
      : Math.round(imp_interno_unit * cant * 1000) / 1000,
  };
};

const evaluarActualizacionCosto = (items, indiceSeleccionado) => {
  const linea = items[indiceSeleccionado];
  const articuloId = Number(linea?.hfsql_articulos_id);
  const precioSeleccionado = toNum(linea?.precio_costo);

  if (!linea || articuloId === -99) {
    return { elegible: false, motivo: "La línea seleccionada no corresponde a un artículo." };
  }

  if (precioSeleccionado <= 0) {
    return {
      elegible: false,
      motivo: "No se puede actualizar el costo desde una línea con precio igual o menor que cero.",
    };
  }

  const preciosPositivos = items
    .filter((item) => Number(item.hfsql_articulos_id) === articuloId)
    .map((item) => toNum(item.precio_costo))
    .filter((precio) => precio > 0);
  const mayorPrecioPositivo = Math.max(...preciosPositivos);
  const todosIguales = preciosPositivos.every(
    (precio) => precio === preciosPositivos[0]
  );

  if (!todosIguales && !(precioSeleccionado > mayorPrecioPositivo * 0.1)) {
    return {
      elegible: false,
      motivo:
        "El precio seleccionado no supera el 10 % del mayor precio informado para este artículo.",
    };
  }

  return { elegible: true, motivo: null };
};

// ─── IVA agrupado desde items ─────────────────────────────────────────────────
const calcularIvaAgrupado = (items) => {
  const map = {};
  for (const i of items) {
    const alic = toNum(i.alicuota_iva);
    const ivaTid = String(i.iva_tipo_id ?? "");
    const iva = toNum(i.importe_iva);
    if (iva > 0) {
      const key = `${ivaTid}|${alic}`;
      if (!map[key])
        map[key] = { base: 0, monto: 0, alicuota: alic, iva_tipo_id: ivaTid };
      map[key].base += toNum(i.importe_linea);
      map[key].monto += iva;
    }
  }
  return Object.values(map).map((v) => ({
    _uid: `iva-${v.iva_tipo_id}-${v.alicuota}`,
    iva_tipo_id: v.iva_tipo_id,
    alicuota: v.alicuota,
    base_imponible: v.base,
    importe_iva: v.monto,
  }));
};

// ─── Estado inicial pie ───────────────────────────────────────────────────────
const PIE_OTROS_INICIAL = { icl: 0, idc: 0, imp_interno: 0, iibb: 0, munic: 0 };

// ─── UID único por fila ───────────────────────────────────────────────────────
let uidCounter = 0;
const nextUid = () => `row-${++uidCounter}-${Date.now()}`;

// ─── Componente NumericFormat para inputs de grilla/pie ──────────────────────
const NumInput = ({
  value, onValueChange, className, placeholder = "0,000", disabled = false,
}) => (
  <NumericFormat
    value={value}
    thousandSeparator="."
    decimalSeparator=","
    decimalScale={3}
    allowNegative={false}
    onValueChange={onValueChange}
    placeholder={placeholder}
    className={className}
    disabled={disabled}
  />
);

// =============================================================================
export default function NuevoComprobante({ onCancelar }) {
  const { showToast } = useSESToast();

  // ── Tipo / cabecera ──────────────────────────────────────────────────────────
  const [tiposTodos, setTiposTodos] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [proveedores, setProveedores] = useState([]);
  const [proveedorId, setProveedorId] = useState("");
  const [puntoVenta, setPuntoVenta] = useState("");
  const [nroComprobante, setNroComprobante] = useState("");
  const [fecha, setFecha] = useState("");
  const [fechaVto, setFechaVto] = useState("");
  const [periodoFiscal, setPeriodoFiscal] = useState("");

  // ── Tipos de IVA ─────────────────────────────────────────────────────────────
  const [tiposIva, setTiposIva] = useState([]);

  // ── Modo ingreso ─────────────────────────────────────────────────────────────
  const [modoIngreso, setModoIngreso] = useState("detallado");

  // ── Ítems ────────────────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);

  // ── Pie IVA filas ────────────────────────────────────────────────────────────
  const [ivaFilas, setIvaFilas] = useState([]);

  // ── Pie Otros Tributos (solo editables: iibb, munic, imp_interno simplificado)
  const [pieOtros, setPieOtros] = useState({ ...PIE_OTROS_INICIAL });

  // ── Total manual ─────────────────────────────────────────────────────────────
  const [totalManual, setTotalManual] = useState(0);

  // ── Pie nota interna / ND ────────────────────────────────────────────────────
  const [motivo, setMotivo] = useState("");
  const [importeTotal, setImporteTotal] = useState(0);

  // ── Stock ────────────────────────────────────────────────────────────────────
  const [actualizarStock, setActualizarStock] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [sucursalId, setSucursalId] = useState("");
  const [depositos, setDepositos] = useState([]);
  const [depositoId, setDepositoId] = useState("");
  const [cargandoDepositos, setCargandoDepositos] = useState(false);

  // ── Validación ───────────────────────────────────────────────────────────────
  const [errores, setErrores] = useState({});

  // ── UI ───────────────────────────────────────────────────────────────────────
  const [cargando, setCargando] = useState(false);

  // ── Columnas sticky ──────────────────────────────────────────────────────────
  // ── Derivados ────────────────────────────────────────────────────────────────
  const configCategoria =
    CONFIG_CATEGORIAS[categoria] ?? CONFIG_CATEGORIA_INICIAL;
  const tiposFiltrados = tiposTodos.filter(
    (t) => categoria && configCategoria.filtroTipo?.(t)
  );
  const tipoSeleccionado = tiposTodos.find((t) => t.id === Number(tipoId));
  const llevaItems = configCategoria.llevaItems;
  const esRemito = configCategoria.esRemito;
  const usaIngresoDetallado = modoIngreso === "detallado";
  const usaIngresoSimplificado = modoIngreso === "simplificado";
  const muestraFormularioSinItems = proveedorId && !llevaItems && categoria !== "";
  const muestraResumen =
    llevaItems &&
    ((esRemito && categoria) ||
      (proveedorId && (items.length > 0 || usaIngresoSimplificado)));
  const muestraTotalSinItems =
    proveedorId && !llevaItems && toNum(importeTotal) > 0;
  const encabezado = configCategoria.encabezado;
  const encabezadoSeccionDocumento = configCategoria.seccionDocumento;
  const tieneDatosIngresados =
    Boolean(proveedorId) ||
    String(puntoVenta).trim() !== "" ||
    String(nroComprobante).trim() !== "" ||
    fecha !== "" ||
    fechaVto !== "" ||
    periodoFiscal !== "" ||
    (tiposFiltrados.length > 1 && tipoId !== "") ||
    modoIngreso !== "detallado" ||
    items.length > 0 ||
    (modoIngreso === "simplificado" &&
      ivaFilas.some(
        (fila) =>
          toNum(fila.base_imponible) !== 0 || toNum(fila.importe_iva) !== 0
      )) ||
    Object.values(pieOtros).some((valor) => toNum(valor) !== 0) ||
    toNum(totalManual) !== 0 ||
    motivo.trim() !== "" ||
    toNum(importeTotal) !== 0 ||
    actualizarStock ||
    Boolean(sucursalId);

  useEffect(() => {
    if (tiposFiltrados.length === 1) {
      const unicoTipoId = String(tiposFiltrados[0].id);
      if (tipoId !== unicoTipoId) setTipoId(unicoTipoId);
    }
  }, [tiposFiltrados, tipoId]);

  const hayCombustibles = items.some((item) => item.es_combustible === true);
  const mostrarICL = hayCombustibles;
  const mostrarIDC = hayCombustibles;
  const mostrarImpInt = items.length > 0;
  const hayItemsReales = items.some((i) => Number(i.hfsql_articulos_id) !== -99);

  // ── Totales desde items ───────────────────────────────────────────────────────
  const subtotalNeto = items.reduce((s, i) => s + toNum(i.importe_linea), 0);
  const totalICL_det = items.reduce((s, i) => s + toNum(i.importe_icl), 0);
  const totalIDC_det = items.reduce((s, i) => s + toNum(i.importe_idc), 0);
  const totalImpInt_det = items.reduce(
    (s, i) => s + toNum(i.importe_imp_interno),
    0
  );

  // ── ICL/IDC/ImpInterno del pie: derivados en detallado, editables en simplificado
  const pieICL = usaIngresoDetallado ? totalICL_det : toNum(pieOtros.icl);
  const pieIDC = usaIngresoDetallado ? totalIDC_det : toNum(pieOtros.idc);
  const pieImpInternoCalculado = !usaIngresoDetallado && pieICL + pieIDC > 0;
  const pieImpInterno =
    usaIngresoDetallado
      ? totalImpInt_det
      : pieImpInternoCalculado
        ? pieICL + pieIDC
        : toNum(pieOtros.imp_interno);

  // ── Totales del pie ───────────────────────────────────────────────────────────
  const totalIvaFilas = ivaFilas.reduce((s, f) => s + toNum(f.importe_iva), 0);
  const totalBaseFilas = ivaFilas.reduce((s, f) => s + toNum(f.base_imponible), 0);
  const totalIvaItems = items.reduce((s, i) => s + toNum(i.importe_iva), 0);
  const baseEfectiva = usaIngresoDetallado ? subtotalNeto : totalBaseFilas;
  const ivaEfectivo = usaIngresoDetallado ? totalIvaItems : totalIvaFilas;
  const sumaCalculada =
    baseEfectiva +
    ivaEfectivo +
    pieImpInterno +
    toNum(pieOtros.iibb) +
    toNum(pieOtros.munic);

  const diferencia = totalManual > 0 ? totalManual - sumaCalculada : null;

  // ── Sincronizar ivaFilas con items (detallado) ────────────────────────────────
  useEffect(() => {
    if (usaIngresoDetallado && llevaItems) {
      setIvaFilas(calcularIvaAgrupado(items));
    }
  }, [items, usaIngresoDetallado, llevaItems]);

  // ── Carga inicial ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/comprobantes/tipos`)
      .then((r) => r.json())
      .then((d) => setTiposTodos(d.data || []));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/proveedores`)
      .then((r) => r.json())
      .then((d) => setProveedores(d.data || []));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/iva-tipos`)
      .then((r) => r.json())
      .then((d) => setTiposIva(d.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if ((!esRemito && !actualizarStock) || sucursales.length > 0) return;
    fetch(`${API_URL}/sucursales`)
      .then((r) => r.json())
      .then((d) => setSucursales(d.data || []))
      .catch(() => {});
  }, [actualizarStock, esRemito, sucursales.length]);

  useEffect(() => {
    if (!sucursalId) {
      setDepositos([]);
      setDepositoId("");
      return;
    }
    setCargandoDepositos(true);
    fetch(`${API_URL}/sucursales/depositos/${sucursalId}`)
      .then((r) => r.json())
      .then((d) => {
        const lista = d.data || [];
        setDepositos(lista);
        if (lista.length === 1) setDepositoId(String(lista[0].id));
        else setDepositoId("");
      })
      .catch(() => {})
      .finally(() => setCargandoDepositos(false));
  }, [sucursalId]);

  // ── Reset ────────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setItems([]);
    setIvaFilas([]);
    setPieOtros({ ...PIE_OTROS_INICIAL });
    setTotalManual(0);
    setFecha("");
    setFechaVto("");
    setPeriodoFiscal("");
    setErrores({});
  };

  const handleCategoriaChange = (e) => {
    const nuevaCategoria = e.target.value;
    setCategoria(nuevaCategoria);
    setTipoId("");
    setModoIngreso("detallado");
    resetForm();
  };

  // ── Toggle modo con advertencia ───────────────────────────────────────────────
  const handleCambiarModo = (modo) => {
    if (modo === modoIngreso) return;
    if (items.length > 0) {
      if (
        !window.confirm("Cambiar de modo borrará todos los ítems ingresados. ¿Confirmás?")
      )
        return;
    }
    setModoIngreso(modo);
    resetForm();
    if (modo === "simplificado" && tiposIva.length > 0) {
      const td = tiposIva[0];
      setIvaFilas([
        {
          _uid: nextUid(),
          iva_tipo_id: String(td.ivaTiposID),
          alicuota: toNum(td.alicuota),
          base_imponible: 0,
          importe_iva: 0,
        },
      ]);
    }
  };

  // ── Actualizar ítem ───────────────────────────────────────────────────────────
  const updateItem = (idx, campo, valor) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        if (
          (campo === "icl_unit" || campo === "idc_unit") &&
          it.es_combustible !== true
        ) {
          const protegido = { ...it, icl_unit: 0, idc_unit: 0 };
          return { ...protegido, ...calcularImportesLinea(protegido) };
        }
        const updated = { ...it, [campo]: valor };
        if (
          [
            "cantidad", "precio_costo", "icl_unit", "idc_unit",
            "imp_interno_monto", "iva_tipo_id",
          ].includes(campo)
        ) {
          if (campo === "iva_tipo_id") {
            const tipo = tiposIva.find((t) => String(t.ivaTiposID) === String(valor));
            if (tipo) updated.alicuota_iva = toNum(tipo.alicuota);
          }
          return { ...updated, ...calcularImportesLinea(updated) };
        }
        return updated;
      })
    );
  };

  const handleActualizarCosto = (idx, checked) => {
    if (!checked) {
      setItems((prev) =>
        prev.map((item, itemIndex) =>
          itemIndex === idx ? { ...item, actualizar_costo: false } : item
        )
      );
      return;
    }

    const evaluacion = evaluarActualizacionCosto(items, idx);
    if (!evaluacion.elegible) {
      showToast({ type: "error", message: evaluacion.motivo });
      return;
    }

    const articuloId = Number(items[idx].hfsql_articulos_id);
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (Number(item.hfsql_articulos_id) !== articuloId) return item;
        return { ...item, actualizar_costo: itemIndex === idx };
      })
    );
  };

  const recalcularItem = (idx) => {
    setItems((prev) =>
      prev.map((it, i) => (i !== idx ? it : { ...it, ...calcularImportesLinea(it) }))
    );
  };

  // ── Concepto manual ───────────────────────────────────────────────────────────
  const agregarConceptoManual = () => {
    const td = tiposIva.find((t) => Math.abs(toNum(t.alicuota) - 21) < 0.01) ||
      tiposIva[0] || { ivaTiposID: "", alicuota: 21 };
    const base = {
      hfsql_articulos_id: -99,
      descripcion: "",
      cod_barras: null,
      cantidad: 1,
      precio_costo_original: 0,
      precio_costo: 0,
      actualizar_costo: false,
      iva_tipo_id: String(td.ivaTiposID),
      alicuota_iva: toNum(td.alicuota),
      es_combustible: false,
      imp_interno_monto: 0,
      icl_unit: 0,
      idc_unit: 0,
    };
    setItems((prev) => [
      ...prev,
      { ...base, _uid: nextUid(), ...calcularImportesLinea(base) },
    ]);
  };

  // ── IVA filas simplificado ────────────────────────────────────────────────────
  const addIvaFila = () => {
    const td = tiposIva[0] || { ivaTiposID: "", alicuota: 0 };
    setIvaFilas((prev) => [
      ...prev,
      {
        _uid: nextUid(),
        iva_tipo_id: String(td.ivaTiposID),
        alicuota: toNum(td.alicuota),
        base_imponible: 0,
        importe_iva: 0,
      },
    ]);
  };

  const updateIvaFila = (idx, campo, valor) => {
    setIvaFilas((prev) =>
      prev.map((f, i) => {
        if (i !== idx) return f;
        let updated = { ...f, [campo]: valor };
        if (campo === "iva_tipo_id") {
          const tipo = tiposIva.find((t) => String(t.ivaTiposID) === String(valor));
          if (tipo) updated.alicuota = toNum(tipo.alicuota);
          updated.importe_iva =
            Math.round(
              ((toNum(updated.base_imponible) * toNum(updated.alicuota)) / 100) * 1000
            ) / 1000;
        }
        if (campo === "base_imponible") {
          updated.importe_iva =
            Math.round(((toNum(valor) * toNum(updated.alicuota)) / 100) * 1000) / 1000;
        }
        return updated;
      })
    );
  };

  const removeIvaFila = (idx) => {
    if (ivaFilas.length <= 1) return;
    setIvaFilas((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Validación ────────────────────────────────────────────────────────────────
  const validarCamposComunes = (errs) => {
    if (!tipoId) errs.tipoId = "Seleccioná el tipo de comprobante";
    if (!proveedorId) errs.proveedorId = "Seleccioná el proveedor";

    // ── Validaciones de fecha ──────────────────────────────────────────────
    if (!fecha) {
      errs.fecha = "Ingresá la fecha de emisión";
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fEmision = new Date(fecha + "T00:00:00");
      if (isNaN(fEmision.getTime())) {
        errs.fecha = "Fecha de emisión inválida";
      } else if (fEmision > hoy) {
        errs.fecha = "La fecha de emisión no puede ser futura";
      }
    }

  };

  const validarFactura = (errs) => {
    if (categoria === "Factura") {
      if (!fechaVto) {
        errs.fechaVto = "Ingresá la fecha de vencimiento";
      } else {
        const fVto = new Date(fechaVto + "T00:00:00");
        const fEmision = new Date(fecha + "T00:00:00");
        if (isNaN(fVto.getTime())) {
          errs.fechaVto = "Fecha de vencimiento inválida";
        } else if (fecha && !isNaN(fEmision.getTime()) && fVto < fEmision) {
          errs.fechaVto = "La fecha de vencimiento no puede ser menor a la de emisión";
        }
      }
    }
  };

  const validarDatosFiscales = (errs) => {
    if (tipoSeleccionado?.cbte_fiscal) {
      if (!periodoFiscal) errs.periodoFiscal = "Seleccioná el período fiscal";
      if (!puntoVenta) errs.puntoVenta = "Ingresá el punto de venta";
      if (!nroComprobante) errs.nroComprobante = "Ingresá el número de comprobante";
    }
  };

  const validarDocumentoConItems = (errs) => {
    if (llevaItems) {
      if (modoIngreso === "detallado") {
        if (items.length === 0) {
          errs.items = "Agregá al menos un ítem";
        } else {
          // ── Descripción obligatoria en conceptos manuales ────────────────
          const sinDescripcion = items.some(
            (i) => Number(i.hfsql_articulos_id) === -99 && !i.descripcion?.trim()
          );
          if (sinDescripcion) errs.items = "Hay conceptos manuales sin descripción";
          else if (subtotalNeto <= 0) errs.items = "El subtotal debe ser mayor a cero";
        }
      } else {
        if (totalBaseFilas <= 0) errs.ivaFilas = "Ingresá la base imponible del IVA";
      }
      if (!Number.isFinite(totalManual) || totalManual <= 0) {
        errs.totalManual = "Ingresá el Total Factura.";
      } else if (
        Number.isFinite(sumaCalculada) &&
        Math.abs(totalManual - sumaCalculada) > 0.05
      ) {
        errs.totalManual = "El Total Factura no coincide con el total calculado.";
      }
    }
  };

  const validarDocumentoSinItems = (errs) => {
    if (!llevaItems) {
      if (toNum(importeTotal) <= 0) errs.importeTotal = "Ingresá el importe total";
    }
  };

  const validarImpuestosItems = (errs) => {
    if (!llevaItems || modoIngreso !== "detallado") return;

    for (const item of items) {
      const esArticulo = Number(item.hfsql_articulos_id) !== -99;
      if (esArticulo && typeof item.es_combustible !== "boolean") {
        if (!errs.items) errs.items = "No se pudo determinar si un artículo es combustible.";
        return;
      }

      const iclUnit = toNum(item.icl_unit);
      const idcUnit = toNum(item.idc_unit);
      const impInternoUnit = toNum(item.imp_interno_monto);
      if (iclUnit < 0 || idcUnit < 0 || impInternoUnit < 0) {
        if (!errs.items) errs.items = "ICL, IDC e Impuesto Interno no pueden ser negativos.";
        return;
      }
      if (item.es_combustible !== true && (iclUnit !== 0 || idcUnit !== 0)) {
        if (!errs.items) errs.items = "Un artículo no combustible no puede informar ICL ni IDC.";
        return;
      }

      const calculados = calcularImportesLinea(item);
      const campos = ["importe_icl", "importe_idc", "importe_imp_interno"];
      if (campos.some((campo) => Math.abs(toNum(item[campo]) - calculados[campo]) > 0.001)) {
        if (!errs.items) errs.items = "Los impuestos calculados de un artículo son inconsistentes.";
        return;
      }
    }
  };

  const validarStockOpcional = (errs) => {
    if (actualizarStock && hayItemsReales) {
      if (!sucursalId) errs.sucursalId = "Seleccioná la sucursal";
      if (!depositoId) errs.depositoId = "Seleccioná el depósito";
    }
  };

  const validarActualizacionCosto = (errs) => {
    const indicesPorArticulo = new Map();

    items.forEach((item, index) => {
      const articuloId = Number(item.hfsql_articulos_id);
      if (articuloId === -99) return;
      if (!indicesPorArticulo.has(articuloId)) indicesPorArticulo.set(articuloId, []);
      indicesPorArticulo.get(articuloId).push(index);
    });

    for (const indices of indicesPorArticulo.values()) {
      const indicesMarcados = indices.filter(
        (index) => items[index].actualizar_costo === true
      );

      if (indicesMarcados.length > 1) {
        if (!errs.items) {
          errs.items =
            "Un artículo tiene más de una línea marcada para actualizar el precio costo.";
        }
        return;
      }

      if (indicesMarcados.length === 1) {
        const evaluacion = evaluarActualizacionCosto(items, indicesMarcados[0]);
        if (!evaluacion.elegible) {
          if (!errs.items) errs.items = evaluacion.motivo;
          return;
        }
      }
    }
  };

  // ── Validación duplicados ───────────────────────────────────────────────
  const validarDuplicado = async (errs) => {
    if (
      tipoSeleccionado?.cbte_fiscal &&
      tipoId &&
      proveedorId &&
      puntoVenta &&
      nroComprobante &&
      !errs.puntoVenta &&
      !errs.nroComprobante
    ) {
      try {
        const r = await fetch(
          `${API_URL}/comprobantes/verificar-duplicado?proveedor_id=${proveedorId}&punto_venta=${Number(puntoVenta)}&numero_comprobante=${Number(nroComprobante)}&comprobante_tipo_id=${tipoId}`
        );
        const d = await r.json();
        if (d.duplicado) {
          const pv = String(puntoVenta).padStart(5, "0");
          const nro = String(nroComprobante).padStart(8, "0");
          errs.nroComprobante = `Ya existe ${tipoSeleccionado.descrip_abrev} ${pv}-${nro} para este proveedor (#${d.comprobante_id})`;
        }
      } catch {
        /* si falla la verificación, dejamos pasar y Node captura el P2002 */
      }
    }
  };

  const validarRemito = (errs) => {
    if (!Number.isInteger(Number(proveedorId)) || Number(proveedorId) <= 0) {
      errs.proveedorId = "Seleccioná un proveedor válido";
    }
    if (!Number.isInteger(Number(puntoVenta)) || Number(puntoVenta) <= 0) {
      errs.puntoVenta = "Ingresá un punto de venta válido";
    }
    if (!Number.isInteger(Number(nroComprobante)) || Number(nroComprobante) <= 0) {
      errs.nroComprobante = "Ingresá un número de remito válido";
    }
    if (!Number.isInteger(Number(sucursalId)) || Number(sucursalId) <= 0) {
      errs.sucursalId = "Seleccioná la sucursal";
    }
    if (!Number.isInteger(Number(depositoId)) || Number(depositoId) <= 0) {
      errs.depositoId = "Seleccioná el depósito";
    }
    if (items.length === 0) {
      errs.items = "Agregá al menos un artículo";
    } else {
      const itemInvalido = items.find(
        (item) =>
          !Number.isInteger(Number(item.hfsql_articulos_id)) ||
          Number(item.hfsql_articulos_id) <= 0 ||
          !(toNum(item.cantidad) > 0) ||
          !resolverCodigoArticulo(item) ||
          !String(item.descripcion || "").trim()
      );
      if (itemInvalido) {
        errs.items =
          "Todos los artículos deben tener código, descripción y cantidad mayor a cero";
      }
    }
  };

  const validar = async () => {
    const errs = {};

    validarCamposComunes(errs);

    if (esRemito) {
      validarRemito(errs);

      setErrores(errs);
      return Object.keys(errs).length === 0;
    }

    validarFactura(errs);

    validarDatosFiscales(errs);

    await validarDuplicado(errs);

    validarDocumentoConItems(errs);

    validarDocumentoSinItems(errs);

    validarImpuestosItems(errs);

    validarActualizacionCosto(errs);

    validarStockOpcional(errs);

    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  // ── REGISTRAR ─────────────────────────────────────────────────────────────────
  const handleConfirmar = async () => {
    const esValido = await validar();
    if (!esValido) {
      showToast({
        type: "error",
        message: "Revisá los campos marcados antes de confirmar.",
      });
      return;
    }
    setCargando(true);
    try {
      if (esRemito) {
        const bodyRemito = {
          proveedor_id: Number(proveedorId),
          punto_venta: Number(puntoVenta),
          numero_remito: Number(nroComprobante),
          fecha,
          deposito_id: Number(depositoId),
          sucursal_id: Number(sucursalId),
          observaciones: motivo || null,
          usuario_id: 1,
          usuario_nombre: "Operador",
          actualizar_stock: true,
          items: items.map((item) => ({
            hfsql_articulos_id: Number(item.hfsql_articulos_id),
            articulo_codigo: resolverCodigoArticulo(item),
            articulo_descrip: String(item.descripcion).trim(),
            cantidad: toNum(item.cantidad),
            precio_costo:
              item.precio_costo == null || item.precio_costo === ""
                ? null
                : toNum(item.precio_costo),
          })),
        };

        const res = await fetch(`${API_URL}/remitos/registrar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyRemito),
        });
        const textoRespuesta = await res.text();
        let data;
        try {
          data = textoRespuesta ? JSON.parse(textoRespuesta) : null;
        } catch {
          alert(
            `El servidor respondió HTTP ${res.status} con un cuerpo no válido para registrar el remito`
          );
          return;
        }

        if (!res.ok || !data?.ok || !data?.data?.id) {
          const mensaje =
            data?.detalle || data?.error || `No se pudo registrar el remito (HTTP ${res.status})`;
          const operacionId = data?.operacionID || data?.data?.operacionID;
          alert(operacionId ? `${mensaje}\nOperación: ${operacionId}` : mensaje);
          return;
        }

        const operacionId = data.data.operacionID || data.operacionID;
        alert(
          `Remito #${data.data.id} registrado${operacionId ? `\nOperación: ${operacionId}` : ""}`
        );
        onCancelar();
        return;
      }

      let subtotal, total, itemsBody, percepcionesBody, ivaDetalleBody;

      if (llevaItems && modoIngreso === "detallado") {
        subtotal = subtotalNeto;
        total = totalManual > 0 ? totalManual : sumaCalculada;
        itemsBody = items.map((i) => ({
          hfsql_articulos_id: i.hfsql_articulos_id,
          articulo_codigo: i.cod_barras || null,
          articulo_descrip: i.descripcion,
          cantidad: toNum(i.cantidad),
          precio_costo: toNum(i.precio_costo),
          importe_linea: toNum(i.importe_linea),
          iva_tipo_id: i.iva_tipo_id || null,
          alicuota_iva: toNum(i.alicuota_iva),
          importe_iva: toNum(i.importe_iva),
          importe_icl: toNum(i.importe_icl),
          importe_idc: toNum(i.importe_idc),
          importe_imp_interno: toNum(i.importe_imp_interno),
          es_combustible: i.es_combustible === true,
          icl_unit: toNum(i.icl_unit),
          idc_unit: toNum(i.idc_unit),
          imp_interno_monto: toNum(i.imp_interno_monto),
          actualizar_costo: i.actualizar_costo,
        }));
        percepcionesBody = [
          toNum(pieOtros.iibb) > 0
            ? { tributo_id: 5, importe: toNum(pieOtros.iibb) }
            : null,
          toNum(pieOtros.munic) > 0
            ? { tributo_id: 7, importe: toNum(pieOtros.munic) }
            : null,
        ].filter(Boolean);
        ivaDetalleBody = ivaFilas.filter((f) => toNum(f.importe_iva) > 0);
      } else if (llevaItems && modoIngreso === "simplificado") {
        subtotal = totalBaseFilas;
        total = totalManual > 0 ? totalManual : sumaCalculada;
        itemsBody = [];
        percepcionesBody = [
          toNum(pieOtros.iibb) > 0
            ? { tributo_id: 5, importe: toNum(pieOtros.iibb) }
            : null,
          toNum(pieOtros.munic) > 0
            ? { tributo_id: 7, importe: toNum(pieOtros.munic) }
            : null,
        ].filter(Boolean);
        ivaDetalleBody = ivaFilas.filter((f) => toNum(f.importe_iva) > 0);
      } else {
        subtotal = toNum(importeTotal);
        total = toNum(importeTotal);
        itemsBody = [];
        percepcionesBody = [];
        ivaDetalleBody = [];
      }

      const body = {
        comprobante_tipo_id: Number(tipoId),
        proveedor_id: Number(proveedorId),
        punto_venta: Number(puntoVenta) || 0,
        numero_comprobante: Number(nroComprobante) || 0,
        fecha,
        fecha_vto: fechaVto || null,
        periodo_fiscal: periodoFiscal || null,
        subtotal,
        total,
        observaciones: motivo || null,
        usuario_id: 1,
        usuario_nombre: "Operador",
        items: itemsBody,
        percepciones: percepcionesBody,
        iva_detalle_manual: ivaDetalleBody,
        pie_otros: {
          icl: pieICL,
          idc: pieIDC,
          imp_interno: pieImpInterno,
          iibb: toNum(pieOtros.iibb),
          munic: toNum(pieOtros.munic),
        },
        modo_ingreso: modoIngreso,
        actualizar_stock: actualizarStock && hayItemsReales,
        deposito_id: depositoId ? Number(depositoId) : null,
        remitos_ids: [],
      };

      const res = await fetch(`${API_URL}/comprobantes/registrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        alert(data.error || "Error al registrar el comprobante");
        return;
      }

      alert(
        `Comprobante #${data.comprobante.id} registrado. Total: $${Number(data.comprobante.total).toLocaleString("es-AR", { minimumFractionDigits: 3 })}`
      );
      onCancelar();
    } catch (err) {
      alert("Error al registrar el comprobante: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  // ── helpers UI ───────────────────────────────────────────────────────────────
  const inputCls = (err) =>
    `w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 ${err ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-blue-500"}`;

  const gridInputCls = (err) =>
    `w-full border rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 ${err ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-500"}`;

  const ErrMsg = ({ campo }) =>
    errores[campo] ? (
      <p className="text-red-500 text-xs mt-0.5">{errores[campo]}</p>
    ) : null;

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <SESWorkspace
      title={encabezado.title}
      subtitle={encabezado.subtitle}
    >
      <SESSection
        variant="premium"
        title={encabezadoSeccionDocumento.title}
        subtitle={encabezadoSeccionDocumento.subtitle}
        icon={FileText}
      >
        <SESComprobanteSection
          CATEGORIAS={CONFIG_CATEGORIAS}
          categoria={categoria}
          handleCategoriaChange={handleCategoriaChange}
          errores={errores}
          ErrMsg={ErrMsg}
          tiposFiltrados={tiposFiltrados}
          tipoId={tipoId}
          setTipoId={setTipoId}
          tipoSeleccionado={tipoSeleccionado}
          puntoVenta={puntoVenta}
          setPuntoVenta={setPuntoVenta}
          nroComprobante={nroComprobante}
          setNroComprobante={setNroComprobante}
          fecha={fecha}
          setFecha={setFecha}
          setErrores={setErrores}
          setPeriodoFiscal={setPeriodoFiscal}
          resolverPeriodoFiscal={resolverPeriodoFiscal}
          fechaVto={fechaVto}
          setFechaVto={setFechaVto}
          periodoFiscal={periodoFiscal}
          generarOpcionesPeriodo={generarOpcionesPeriodo}
          esRemito={esRemito}
        />

        {(tipoId || tiposFiltrados.length === 1) && (
          <SESFormRow>
            <SESProveedorSection
              proveedorId={proveedorId}
              setProveedorId={setProveedorId}
              proveedores={proveedores}
              errores={errores}
              ErrMsg={ErrMsg}
            />
          </SESFormRow>
        )}
      </SESSection>

      {/* ── ZONA 3 — Items ─────────────────────────────────────────────────── */}
      {proveedorId && llevaItems && (
        <SESItemsSection
          proveedorId={proveedorId}
          modoIngreso={modoIngreso}
          handleCambiarModo={handleCambiarModo}
          tiposIva={tiposIva}
          toNum={toNum}
          setItems={setItems}
          nextUid={nextUid}
          calcularImportesLinea={calcularImportesLinea}
          setErrores={setErrores}
          agregarConceptoManual={agregarConceptoManual}
          ErrMsg={ErrMsg}
          items={items}
          mostrarICL={mostrarICL}
          mostrarIDC={mostrarIDC}
          mostrarImpInt={mostrarImpInt}
          updateItem={updateItem}
          handleActualizarCosto={handleActualizarCosto}
          NumInput={NumInput}
          gridInputCls={gridInputCls}
          fmt3={fmt3}
          esRemito={esRemito}
        />
      )}
      {/* ── ZONA 3B — Nota Interna / ND ────────────────────────────────────── */}
      {muestraFormularioSinItems && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Motivo</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Descripción del ajuste..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Importe total
            </label>
            <NumInput
              value={importeTotal}
              onValueChange={(v) => setImporteTotal(v.floatValue ?? 0)}
              className={inputCls(errores.importeTotal)}
            />
            <ErrMsg campo="importeTotal" />
          </div>
        </div>
      )}

      {/* ── ZONA 4 — Pie ───────────────────────────────────────────────────── */}
      {muestraResumen && (
          <SESResumenSection
            modoIngreso={modoIngreso}
            addIvaFila={addIvaFila}
            ivaFilas={ivaFilas}
            NumInput={NumInput}
            updateIvaFila={updateIvaFila}
            gridInputCls={gridInputCls}
            errores={errores}
            fmt3={fmt3}
            tiposIva={tiposIva}
            fmt2={fmt2}
            removeIvaFila={removeIvaFila}
            ErrMsg={ErrMsg}
            pieICL={pieICL}
            pieOtros={pieOtros}
            setPieOtros={setPieOtros}
            pieIDC={pieIDC}
            pieImpInternoCalculado={pieImpInternoCalculado}
            pieImpInterno={pieImpInterno}
            totalBaseFilas={totalBaseFilas}
            totalIvaFilas={totalIvaFilas}
            toNum={toNum}
            sumaCalculada={sumaCalculada}
            totalManual={totalManual}
            setTotalManual={setTotalManual}
            setErrores={setErrores}
            diferencia={diferencia}
            hayItemsReales={hayItemsReales}
            actualizarStock={actualizarStock}
            setActualizarStock={setActualizarStock}
            setSucursalId={setSucursalId}
            setDepositoId={setDepositoId}
            sucursales={sucursales}
            sucursalId={sucursalId}
            depositos={depositos}
            depositoId={depositoId}
            cargandoDepositos={cargandoDepositos}
            esRemito={esRemito}
          />
        )}

      {/* Pie nota interna / ND */}
      {muestraTotalSinItems && (
        <div className="flex justify-between items-center border-t border-gray-200 pt-4">
          <div className="flex items-center">
            <span className="font-semibold text-gray-800 mr-4">Total:</span>
            <span className="font-bold text-gray-900 text-base">
              $ {fmt3(toNum(importeTotal))}
            </span>
          </div>
        </div>
      )}

      <SESFooterActions
        onCancelar={onCancelar}
        handleConfirmar={handleConfirmar}
        cargando={cargando}
        tieneDatosIngresados={tieneDatosIngresados}
        confirmarLabel={esRemito ? "Confirmar remito" : "Confirmar comprobante"}
      />
    </SESWorkspace>
  );
}
