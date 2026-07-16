import { Calculator, Trash2 } from "lucide-react";

import SESIconButton from "../ui/actions/SESIconButton";
import SESSection from "../ui/layout/SESSection";
import SESCheckbox from "../ui/forms/SESCheckbox";

export default function SESResumenSection({
  modoIngreso,
  addIvaFila,
  ivaFilas,
  NumInput,
  updateIvaFila,
  gridInputCls,
  errores,
  fmt3,
  tiposIva,
  fmt2,
  removeIvaFila,
  ErrMsg,
  pieICL,
  pieOtros,
  setPieOtros,
  pieIDC,
  pieImpInternoCalculado,
  pieImpInterno,
  totalBaseFilas,
  totalIvaFilas,
  toNum,
  sumaCalculada,
  totalManual,
  setTotalManual,
  setErrores,
  diferencia,
  hayItemsReales,
  actualizarStock,
  setActualizarStock,
  setSucursalId,
  setDepositoId,
  sucursales,
  sucursalId,
  depositos,
  depositoId,
  cargandoDepositos,
  esRemito,
}) {
  if (esRemito) {
    return (
      <SESSection
        variant="premium"
        title="Recepción"
        subtitle="Sucursal, depósito y actualización obligatoria de stock"
        icon={Calculator}
        contentClassName="px-8 py-5"
      >
        <div className="grid grid-cols-1 gap-x-3 gap-y-2 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Sucursal
            </label>
            <select
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
              className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 ${errores.sucursalId ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-500"}`}
            >
              <option value="">— Sucursal —</option>
              {sucursales.map((s) => (
                <option key={s.sucursalesID} value={s.sucursalesID}>
                  {s.nombreSucursal}
                </option>
              ))}
            </select>
            <ErrMsg campo="sucursalId" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Depósito
            </label>
            <select
              value={depositoId}
              onChange={(e) => setDepositoId(e.target.value)}
              disabled={!sucursalId || cargandoDepositos}
              className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 disabled:bg-gray-100 disabled:text-gray-400 ${errores.depositoId ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-500"}`}
            >
              <option value="">
                {cargandoDepositos ? "Cargando..." : "— Depósito —"}
              </option>
              {depositos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
            <ErrMsg campo="depositoId" />
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          La actualización de stock es obligatoria para registrar el remito.
        </p>
        <ErrMsg campo="items" />

      </SESSection>
    );
  }

  return (
    <SESSection
      variant="premium"
      title="Resumen"
      subtitle="Totales, IVA, tributos y verificación final"
      icon={Calculator}
    >
      <div>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  IVA
                </span>
                {modoIngreso === "simplificado" && (
                  <button
                    onClick={addIvaFila}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    ＋ Agregar alícuota
                  </button>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400">
                    <th className="text-left pb-1 font-medium">Base imponible</th>
                    <th className="text-right pb-1 font-medium w-36">Alíc.</th>
                    <th className="text-right pb-1 font-medium w-28">IVA</th>
                    {modoIngreso === "simplificado" && <th className="w-6"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ivaFilas.length === 0 && modoIngreso === "detallado" && (
                    <tr>
                      <td colSpan={3} className="text-xs text-gray-400 py-2">
                        Se completará al agregar ítems
                      </td>
                    </tr>
                  )}
                  {ivaFilas.map((f, idx) => (
                    <tr key={f._uid}>
                      <td className="py-1 pr-2">
                        {modoIngreso === "simplificado" ? (
                          <NumInput
                            value={f.base_imponible}
                            onValueChange={(v) =>
                              updateIvaFila(
                                idx,
                                "base_imponible",
                                v.floatValue ?? 0
                              )
                            }
                            className={gridInputCls(errores.ivaFilas)}
                          />
                        ) : (
                          <span className="text-gray-700">
                            $ {fmt3(f.base_imponible)}
                          </span>
                        )}
                      </td>
                      <td className="py-1 pr-2">
                        {modoIngreso === "simplificado" ? (
                          <select
                            value={f.iva_tipo_id || ""}
                            onChange={(e) =>
                              updateIvaFila(idx, "iva_tipo_id", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {tiposIva.map((t) => (
                              <option key={t.ivaTiposID} value={t.ivaTiposID}>
                                {t.descripcion}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-700 text-right block">
                            {fmt2(f.alicuota)}%
                          </span>
                        )}
                      </td>
                      <td className="py-1 text-right">
                        <span className="text-gray-700">
                          $ {fmt3(f.importe_iva)}
                        </span>
                      </td>
                      {modoIngreso === "simplificado" && (
                        <td className="py-1 pl-1">
                          <SESIconButton
                            icon={Trash2}
                            label="Eliminar alícuota de IVA"
                            variant="danger"
                            size="sm"
                            onClick={() => removeIvaFila(idx)}
                            className="h-6 w-6 rounded-md"
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <ErrMsg campo="ivaFilas" />
            </div>

            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
                Otros tributos
              </span>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  <tr>
                    <td className="py-1 pr-2 text-gray-500 w-40">ICL (ex-ITC)</td>
                    <td className="py-1">
                      {modoIngreso === "detallado" ? (
                        <div className="text-right text-gray-700 pr-2">
                          $ {fmt3(pieICL)}
                        </div>
                      ) : (
                        <NumInput
                          value={pieOtros.icl}
                          onValueChange={(v) =>
                            setPieOtros((p) => ({ ...p, icl: v.floatValue ?? 0 }))
                          }
                          className={gridInputCls()}
                        />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-2 text-gray-500">IDC</td>
                    <td className="py-1">
                      {modoIngreso === "detallado" ? (
                        <div className="text-right text-gray-700 pr-2">
                          $ {fmt3(pieIDC)}
                        </div>
                      ) : (
                        <NumInput
                          value={pieOtros.idc}
                          onValueChange={(v) =>
                            setPieOtros((p) => ({ ...p, idc: v.floatValue ?? 0 }))
                          }
                          className={gridInputCls()}
                        />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-2 text-gray-500">Imp. Interno</td>
                    <td className="py-1">
                      {pieImpInternoCalculado || modoIngreso === "detallado" ? (
                        <div className="text-right text-gray-700 pr-2">
                          $ {fmt3(pieImpInterno)}
                        </div>
                      ) : (
                        <NumInput
                          value={pieOtros.imp_interno}
                          onValueChange={(v) =>
                            setPieOtros((p) => ({
                              ...p,
                              imp_interno: v.floatValue ?? 0,
                            }))
                          }
                          className={gridInputCls()}
                        />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-2 text-gray-500">Perc. IIBB</td>
                    <td className="py-1">
                      <NumInput
                        value={pieOtros.iibb}
                        onValueChange={(v) =>
                          setPieOtros((p) => ({ ...p, iibb: v.floatValue ?? 0 }))
                        }
                        className={gridInputCls()}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-2 text-gray-500">Perc. Municipales</td>
                    <td className="py-1">
                      <NumInput
                        value={pieOtros.munic}
                        onValueChange={(v) =>
                          setPieOtros((p) => ({ ...p, munic: v.floatValue ?? 0 }))
                        }
                        className={gridInputCls()}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Neto gravado:</span>
              <span className="text-gray-800 font-medium">
                $ {fmt3(totalBaseFilas)}
              </span>
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
                <span>↳ ICL</span>
                <span>$ {fmt3(pieICL)}</span>
              </div>
            )}
            {pieIDC > 0 && (
              <div className="flex justify-between text-xs text-gray-400 pl-3">
                <span>↳ IDC</span>
                <span>$ {fmt3(pieIDC)}</span>
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
                <span className="text-sm font-medium text-gray-700">
                  Total factura:
                </span>
                <NumInput
                  value={totalManual}
                  onValueChange={(v) => {
                    setTotalManual(v.floatValue ?? 0);
                    setErrores((p) => ({ ...p, totalManual: undefined }));
                  }}
                  className={`w-40 border rounded px-2 py-1 text-right text-sm font-semibold focus:outline-none focus:ring-1 ${errores.totalManual ? "border-red-400 focus:ring-red-300" : "border-gray-400 focus:ring-blue-500"}`}
                />
              </div>
              {diferencia !== null && (
                <div
                  className={`text-right text-xs mt-1 ${Math.abs(diferencia) <= 0.05 ? "text-green-600" : "text-amber-600"}`}
                >
                  {Math.abs(diferencia) <= 0.05
                    ? "✓ Total verificado"
                    : `Diferencia: $ ${fmt3(diferencia)}`}
                </div>
              )}
              <ErrMsg campo="totalManual" />
            </div>

            {modoIngreso === "detallado" && hayItemsReales && (
              <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                <SESCheckbox
                  label="Actualizar stock"
                  checked={actualizarStock}
                  onChange={(e) => {
                    setActualizarStock(e.target.checked);
                    if (!e.target.checked) {
                      setSucursalId("");
                      setDepositoId("");
                    }
                  }}
                />
                {actualizarStock && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Sucursal
                      </label>
                      <select
                        value={sucursalId}
                        onChange={(e) => setSucursalId(e.target.value)}
                        className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 ${errores.sucursalId ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-500"}`}
                      >
                        <option value="">— Sucursal —</option>
                        {sucursales.map((s) => (
                          <option key={s.sucursalesID} value={s.sucursalesID}>
                            {s.nombreSucursal}
                          </option>
                        ))}
                      </select>
                      <ErrMsg campo="sucursalId" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Depósito
                      </label>
                      <select
                        value={depositoId}
                        onChange={(e) => setDepositoId(e.target.value)}
                        disabled={!sucursalId || cargandoDepositos}
                        className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 disabled:bg-gray-100 disabled:text-gray-400 ${errores.depositoId ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-500"}`}
                      >
                        <option value="">
                          {cargandoDepositos ? "Cargando..." : "— Depósito —"}
                        </option>
                        {depositos.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.nombre}
                          </option>
                        ))}
                      </select>
                      <ErrMsg campo="depositoId" />
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </SESSection>
  );
}
