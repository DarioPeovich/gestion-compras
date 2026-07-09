import SESField from "../ui/forms/SESField";
import SESSelect from "../ui/forms/SESSelect";

export default function SESProveedorSection({
  proveedorId,
  setProveedorId,
  proveedores,
  errores,
  ErrMsg,
}) {
  const proveedorSeleccionado = proveedores.find(
    (p) => String(p.id) === String(proveedorId)
  );

  const condicionIva =
    proveedorSeleccionado?.condicion_iva ??
    proveedorSeleccionado?.condicionIVA ??
    proveedorSeleccionado?.iva_condicion ??
    proveedorSeleccionado?.condicion_fiscal ??
    proveedorSeleccionado?.responsable_iva ??
    null;

  return (
    <>
      <SESField label="Proveedor" required className="col-span-12 md:col-span-6">
        <SESSelect
          value={proveedorId}
          onChange={(e) => setProveedorId(e.target.value)}
          error={errores.proveedorId}
        >
          <option value="">— Seleccioná un proveedor —</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.razon_social}
            </option>
          ))}
        </SESSelect>
        <ErrMsg campo="proveedorId" />
      </SESField>

      <SESField label="CUIT" className="col-span-12 md:col-span-3">
        <div className="min-h-[38px] rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {proveedorSeleccionado?.cuit || "—"}
        </div>
      </SESField>

      <SESField label="Condición IVA" className="col-span-12 md:col-span-3">
        <div className="min-h-[38px] rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {condicionIva || "—"}
        </div>
      </SESField>
    </>
  );
}
