import SESFormRow from "../ui/forms/SESFormRow";
import SESField from "../ui/forms/SESField";
import SESInput from "../ui/forms/SESInput";
import SESSelect from "../ui/forms/SESSelect";
import SESDatePicker from "../ui/forms/SESDatePicker";

export default function SESComprobanteSection({
  CATEGORIAS,
  categoria,
  handleCategoriaChange,
  errores,
  ErrMsg,
  tiposFiltrados,
  tipoId,
  setTipoId,
  tipoSeleccionado,
  puntoVenta,
  setPuntoVenta,
  nroComprobante,
  setNroComprobante,
  fecha,
  setFecha,
  setErrores,
  setPeriodoFiscal,
  resolverPeriodoFiscal,
  fechaVto,
  setFechaVto,
  periodoFiscal,
  generarOpcionesPeriodo,
}) {
  return (
    <>
      <SESFormRow>
        <SESField
          label="Tipo de comprobante"
          required
          className="col-span-12 md:col-span-6"
        >
          <SESSelect
            value={categoria}
            onChange={handleCategoriaChange}
            error={errores.tipoId}
          >
            <option value="">— Seleccioná un tipo —</option>
            {Object.keys(CATEGORIAS).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </SESSelect>
          <ErrMsg campo="tipoId" />
        </SESField>

        {tiposFiltrados.length > 1 && (
          <SESField label="Letra" className="col-span-12 md:col-span-6">
            <SESSelect
              value={tipoId}
              onChange={(e) => setTipoId(e.target.value)}
              error={errores.tipoId}
            >
              <option value="">— Letra —</option>
              {tiposFiltrados.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.letra} — {t.descripcion}
                </option>
              ))}
            </SESSelect>

            {tipoSeleccionado?.letra === "B" && (
              <p className="text-amber-600 text-xs mt-1">
                ⚠ Las Facturas B no discriminan impuestos y no son válidas para el Libro
                IVA Compras. Se recomienda no registrarlas.
              </p>
            )}
          </SESField>
        )}

        {tiposFiltrados.length === 1 && tipoId !== String(tiposFiltrados[0].id) && (
          <div className="hidden">
            {(() => {
              setTipoId(String(tiposFiltrados[0].id));
              return null;
            })()}
          </div>
        )}
      </SESFormRow>

      {(tipoId || tiposFiltrados.length === 1) && (
        <SESFormRow>
          {tipoSeleccionado?.cbte_fiscal && (
            <>
              <SESField
                label="Punto de venta"
                required
                className="col-span-12 md:col-span-3"
              >
                <SESInput
                  value={puntoVenta}
                  onChange={(e) => setPuntoVenta(e.target.value.replace(/\D/g, ""))}
                  onBlur={(e) => {
                    if (e.target.value) setPuntoVenta(e.target.value.padStart(5, "0"));
                  }}
                  placeholder="00001"
                  error={errores.puntoVenta}
                />
                <ErrMsg campo="puntoVenta" />
              </SESField>

              <SESField label="Número" required className="col-span-12 md:col-span-3">
                <SESInput
                  value={nroComprobante}
                  onChange={(e) => setNroComprobante(e.target.value.replace(/\D/g, ""))}
                  onBlur={(e) => {
                    if (e.target.value)
                      setNroComprobante(e.target.value.padStart(8, "0"));
                  }}
                  placeholder="00000001"
                  error={errores.nroComprobante}
                />
                <ErrMsg campo="nroComprobante" />
              </SESField>
            </>
          )}

          <SESField label="Fecha de emisión" className="col-span-12 md:col-span-3">
            <SESDatePicker
              value={fecha}
              onChange={(e) => {
                const v = e.target.value;
                setFecha(v);
                setErrores((prev) => ({
                  ...prev,
                  fecha: undefined,
                  fechaVto: undefined,
                }));
                if (tipoSeleccionado?.cbte_fiscal) {
                  setPeriodoFiscal(resolverPeriodoFiscal(v));
                } else if (v) {
                  const [yyyy, mm] = v.split("-");
                  setPeriodoFiscal(`${mm}/${yyyy}`);
                }
              }}
              error={errores.fecha}
            />
            <ErrMsg campo="fecha" />
          </SESField>

          {categoria === "Factura" && (
            <SESField
              label="Fecha de vencimiento"
              className="col-span-12 md:col-span-3"
            >
              <SESDatePicker
                value={fechaVto}
                onChange={(e) => {
                  setFechaVto(e.target.value);
                  setErrores((prev) => ({ ...prev, fechaVto: undefined }));
                }}
                error={errores.fechaVto}
              />
              <ErrMsg campo="fechaVto" />
            </SESField>
          )}

          {tipoSeleccionado?.cbte_fiscal && (
            <SESField label="Período fiscal" className="col-span-12 md:col-span-3">
              <SESSelect
                value={periodoFiscal}
                onChange={(e) => {
                  setPeriodoFiscal(e.target.value);
                  setErrores((prev) => ({ ...prev, periodoFiscal: undefined }));
                }}
                error={errores.periodoFiscal}
              >
                <option value="">— Seleccioná el período —</option>
                {generarOpcionesPeriodo().map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </SESSelect>
              <ErrMsg campo="periodoFiscal" />
            </SESField>
          )}
        </SESFormRow>
      )}
    </>
  );
}
