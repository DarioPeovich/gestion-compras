import { Package, Trash2 } from "lucide-react";

import SESSection from "../ui/layout/SESSection";
import SESIconButton from "../ui/actions/SESIconButton";
import BuscadorArticulos from "./BuscadorArticulos.jsx";

export default function SESItemsRemito({
  proveedorId, modoIngreso, tiposIva, toNum, setItems, nextUid,
  calcularImportesLinea, setErrores, ErrMsg, items, updateItem,
  NumInput, gridInputCls,
}) {
  const columnasItems = ["14ch", "16ch", "minmax(0, 1fr)", "1.5rem"]
    .filter(Boolean)
    .join(" ");

  return (
    <SESSection
      variant="premium"
      title="Ítems"
      subtitle="Artículos, cantidades y costos"
      icon={Package}
    >
      <>
        {modoIngreso === "detallado" && (
          <>
            <BuscadorArticulos
              proveedorId={proveedorId}
              onSeleccionar={(articulo) => {
                const base = {
                  hfsql_articulos_id: articulo.articulos_id,
                  descripcion: articulo.descripcion,
                  cod_barras: articulo.cod_barras,
                  cod_proveedor:
                    articulo.cod_proveedor ?? articulo.codigo_proveedor ??
                    articulo.codigoProveedor ?? articulo.codProveedor ?? null,
                  cod_ses:
                    articulo.cod_ses ?? articulo.codigo_ses ?? articulo.codigoSES ??
                    articulo.codSES ?? articulo.articulos_id ?? null,
                  articulo_codigo:
                    articulo.cod_ses ?? articulo.codigo_ses ?? articulo.codigoSES ??
                    articulo.codSES ?? articulo.cod_proveedor ??
                    articulo.codigo_proveedor ?? articulo.codigoProveedor ??
                    articulo.codProveedor ?? articulo.cod_barras ?? null,
                  cantidad: 1,
                  precio_costo_original: articulo.precio_costo,
                  precio_costo:
                    articulo.precio_costo_proveedor ?? articulo.precio_costo ?? null,
                  actualizar_costo: true,
                  iva_tipo_id: String(
                    articulo.IvaTiposID ?? articulo.iva_tipos_id ??
                    tiposIva.find(
                      (t) => toNum(t.alicuota) === toNum(articulo.alicuota_iva)
                    )?.ivaTiposID ?? ""
                  ),
                  alicuota_iva: toNum(articulo.alicuota_iva),
                  imp_interno_monto: toNum(articulo.imp_interno_monto),
                  icl_unit: toNum(articulo.imp_transf_comb),
                  idc_unit: toNum(articulo.imp_dioxido_carbono),
                };
                setItems((prev) => [
                  ...prev,
                  { ...base, _uid: nextUid(), ...calcularImportesLinea(base) },
                ]);
                setErrores((prev) => ({ ...prev, items: undefined }));
              }}
            />
            <ErrMsg campo="items" />

            {items.length > 0 && (
              <div className="mt-3 border border-gray-200 rounded">
                <div className="divide-y divide-gray-100">
                  {items.map((item, idx) => {
                    const esManual = Number(item.hfsql_articulos_id) === -99;
                    const datosSecundarios = [
                      item.cod_barras ? `CB: ${item.cod_barras}` : null,
                      item.cod_proveedor ? `Cod. Prov: ${item.cod_proveedor}` : null,
                      item.cod_ses ? `Cod. SES: ${item.cod_ses}` : null,
                    ].filter(Boolean);
                    return (
                      <div
                        key={item._uid}
                        className={`px-2 py-3 hover:bg-gray-50 ${esManual ? "bg-amber-50" : "bg-white"}`}
                      >
                        <div className="mb-2">
                          {esManual ? (
                            <input
                              type="text"
                              value={item.descripcion}
                              onChange={(e) => updateItem(idx, "descripcion", e.target.value)}
                              placeholder="Descripción del concepto..."
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                            />
                          ) : (
                            <div>
                              <div className="font-medium text-gray-800 leading-snug truncate">
                                {item.descripcion}
                              </div>
                              {datosSecundarios.length > 0 && (
                                <div className="text-xs text-gray-500 leading-tight mt-0.5">
                                  {datosSecundarios.join(" | ")}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div
                          className="grid items-end gap-1 text-sm whitespace-nowrap"
                          style={{ gridTemplateColumns: columnasItems }}
                        >
                          <div>
                            <div className="mb-1 text-xs text-gray-500">Cant.</div>
                            <NumInput value={item.cantidad} onValueChange={(v) => updateItem(idx, "cantidad", v.floatValue ?? 0)} className={gridInputCls()} />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-gray-500 text-right">Costo</div>
                            <NumInput value={item.precio_costo} onValueChange={(v) => updateItem(idx, "precio_costo", v.floatValue ?? 0)} className={gridInputCls()} />
                          </div>
                          <div aria-hidden="true" />
                          <div className="w-6 justify-self-end text-center">
                            <div className="mb-1 text-transparent">.</div>
                            <SESIconButton
                              icon={Trash2} label="Eliminar ítem" variant="danger" size="sm"
                              onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                              className="h-6 w-6 rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </>
    </SESSection>
  );
}
