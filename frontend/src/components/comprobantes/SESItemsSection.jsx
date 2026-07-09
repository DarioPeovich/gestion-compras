import { Package } from "lucide-react";

import SESSection from "../ui/layout/SESSection";
import SESToolbar from "../ui/layout/SESToolbar";
import SESToggleGroup from "../ui/forms/SESToggleGroup";
import SESButton from "../ui/actions/SESButton";
import SESCheckbox from "../ui/forms/SESCheckbox";
import BuscadorArticulos from "./BuscadorArticulos.jsx";

export default function SESItemsSection({
  proveedorId,
  modoIngreso,
  handleCambiarModo,
  tiposIva,
  toNum,
  setItems,
  nextUid,
  calcularImportesLinea,
  setErrores,
  agregarConceptoManual,
  ErrMsg,
  items,
  mostrarICL,
  mostrarIDC,
  mostrarImpInt,
  updateItem,
  NumInput,
  gridInputCls,
  fmt3,
}) {
  return (
    <SESSection
      variant="premium"
      title="Ítems"
      subtitle="Artículos, cantidades, costos e impuestos"
      icon={Package}
    >
      <>
        <SESToolbar>
          <SESToggleGroup
            value={modoIngreso}
            onChange={handleCambiarModo}
            options={[
              { value: "detallado", label: "Detallado" },
              { value: "simplificado", label: "Simplificado" },
            ]}
          />
        </SESToolbar>

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
                    articulo.cod_proveedor ??
                    articulo.codigo_proveedor ??
                    articulo.codigoProveedor ??
                    articulo.codProveedor ??
                    null,
                  cod_ses:
                    articulo.cod_ses ??
                    articulo.codigo_ses ??
                    articulo.codigoSES ??
                    articulo.codSES ??
                    articulo.articulos_id ??
                    null,
                  cantidad: 1,
                  precio_costo_original: articulo.precio_costo,
                  precio_costo:
                    articulo.precio_costo_proveedor || articulo.precio_costo || 0,
                  actualizar_costo: true,
                  iva_tipo_id: String(
                    articulo.IvaTiposID ??
                      articulo.iva_tipos_id ??
                      tiposIva.find(
                        (t) => toNum(t.alicuota) === toNum(articulo.alicuota_iva)
                      )?.ivaTiposID ??
                      ""
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
            <SESToolbar className="pt-3 pb-2">
              <SESButton
                variant="secondary"
                size="sm"
                onClick={agregarConceptoManual}
              >
                Agregar concepto manual
              </SESButton>
            </SESToolbar>
            <ErrMsg campo="items" />

            {items.length > 0 && (
              <div className="mt-3 overflow-x-auto border border-gray-200 rounded">
                <div className="min-w-[980px] divide-y divide-gray-100">
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
                        className={`px-3 py-3 hover:bg-gray-50 ${esManual ? "bg-amber-50" : "bg-white"}`}
                      >
                        <div className="mb-2">
                          {esManual ? (
                            <input
                              type="text"
                              value={item.descripcion}
                              onChange={(e) =>
                                updateItem(idx, "descripcion", e.target.value)
                              }
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

                        <div className="grid grid-cols-[minmax(0,1fr)_2rem] gap-2 items-end text-xs">
                          <div className="flex items-end gap-2 min-w-max">
                            <div className="w-16 shrink-0">
                            <div className="mb-1 text-gray-500">Cant.</div>
                            <NumInput
                              value={item.cantidad}
                              onValueChange={(v) =>
                                updateItem(idx, "cantidad", v.floatValue ?? 0)
                              }
                              className={gridInputCls()}
                            />
                          </div>

                          <div className="w-32 shrink-0">
                            <div className="mb-1 text-gray-500 text-right">Costo act.</div>
                            <div className="py-1 text-right text-gray-400">
                              {esManual ? "—" : `$ ${fmt3(item.precio_costo_original)}`}
                            </div>
                          </div>

                          <div className="w-32 shrink-0">
                            <div className="mb-1 text-gray-500 text-right">Costo fact.</div>
                            <NumInput
                              value={item.precio_costo}
                              onValueChange={(v) =>
                                updateItem(idx, "precio_costo", v.floatValue ?? 0)
                              }
                              className={gridInputCls()}
                            />
                          </div>

                          <div className="w-28 shrink-0">
                            <div className="mb-1 text-gray-500">Tipo IVA</div>
                            <select
                              value={String(item.iva_tipo_id || "")}
                              onChange={(e) =>
                                updateItem(idx, "iva_tipo_id", e.target.value)
                              }
                              className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {tiposIva.map((t) => (
                                <option key={t.ivaTiposID} value={String(t.ivaTiposID)}>
                                  {t.descripcion}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-32 shrink-0">
                            <div className="mb-1 text-gray-500 text-right">IVA</div>
                            <div className="py-1 text-right text-gray-700">
                              $ {fmt3(item.importe_iva)}
                            </div>
                          </div>

                          {mostrarICL && (
                            <div className="w-32 shrink-0">
                              <div className="mb-1 text-gray-500 text-right">ICL</div>
                              {esManual ? (
                                <div className="py-1 text-center text-gray-300">—</div>
                              ) : (
                                <NumInput
                                  value={item.icl_unit}
                                  onValueChange={(v) =>
                                    updateItem(idx, "icl_unit", v.floatValue ?? 0)
                                  }
                                  className={gridInputCls()}
                                />
                              )}
                            </div>
                          )}

                          {mostrarIDC && (
                            <div className="w-32 shrink-0">
                              <div className="mb-1 text-gray-500 text-right">IDC</div>
                              {esManual ? (
                                <div className="py-1 text-center text-gray-300">—</div>
                              ) : (
                                <NumInput
                                  value={item.idc_unit}
                                  onValueChange={(v) =>
                                    updateItem(idx, "idc_unit", v.floatValue ?? 0)
                                  }
                                  className={gridInputCls()}
                                />
                              )}
                            </div>
                          )}

                          {mostrarImpInt && (
                            <div className="w-32 shrink-0">
                              <div className="mb-1 text-gray-500 text-right">Imp.Int.</div>
                              <div className="py-1 text-right text-gray-700">
                                {esManual ? "—" : `$ ${fmt3(item.importe_imp_interno)}`}
                              </div>
                            </div>
                          )}

                          <div className="w-24 shrink-0">
                            <div className="mb-1 text-gray-500 text-center">Actualiz.Precio</div>
                            <div className="py-1 text-center">
                              {esManual ? (
                                <span className="text-gray-300">—</span>
                              ) : (
                                <SESCheckbox
                                  checked={item.actualizar_costo}
                                  onChange={(e) =>
                                    updateItem(idx, "actualizar_costo", e.target.checked)
                                  }
                                />
                              )}
                            </div>
                          </div>

                          <div className="w-36 shrink-0">
                            <div className="mb-1 text-gray-500 text-right">Importe</div>
                            <div className="py-1 text-right text-gray-700 font-medium">
                              $ {fmt3(item.importe_linea)}
                            </div>
                          </div>

                          </div>

                          <div className="w-8 justify-self-end">
                            <div className="mb-1 text-transparent">.</div>
                            <button
                              onClick={() =>
                                setItems((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="text-red-400 hover:text-red-600 text-lg leading-none"
                            >
                              ×
                            </button>
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

        {modoIngreso === "simplificado" && (
          <p className="text-xs text-gray-500 mt-1">
            Ingresá los totales del pie directamente desde la factura del proveedor.
          </p>
        )}
      </>
    </SESSection>
  );
}
