import { Building2, Calculator, FileText, Package } from "lucide-react";
import { Trash2, RefreshCw, Search } from "lucide-react";
import { useState } from "react";

import SESControl from "./forms/SESControl";
import SESField from "./forms/SESField";
import SESFormRow from "./forms/SESFormRow";
import SESInput from "./forms/SESInput";
import SESPage from "./layout/SESPage";
import SESSection from "./layout/SESSection";
import SESWorkspace from "./layout/SESWorkspace";
import SESSelect from "./forms/SESSelect";
import SESButton from "./actions/SESButton";
import SESActionBar from "./layout/SESActionBar";
import SESDatePicker from "./forms/SESDatePicker";
import SESNumberInput from "./forms/SESNumberInput";
import SESTable from "./data/SESTable";
import SESSummary from "./summary/SESSummary";
import SESCheckbox from "./forms/SESCheckbox";
import SESIconButton from "./actions/SESIconButton";
import SESButtonGroup from "./actions/SESButtonGroup";
import SESToolbar from "./layout/SESToolbar";
import SESBadge from "./feedback/SESBadge";
import SESBadgeGroup from "./feedback/SESBadgeGroup";
import SESSearchBox from "./forms/SESSearchBox";
import SESToggleGroup from "./forms/SESToggleGroup";

export default function UIDesign() {
  const [busqueda, setBusqueda] = useState("");
  const [modoIngreso, setModoIngreso] = useState("detallado");
  return (
    <SESPage fluid>
      <SESWorkspace
        title="Nuevo comprobante"
        subtitle="Recepción y registración de comprobantes de compra"
      >
        <SESSection
          variant="premium"
          title="Proveedor"
          subtitle="Información fiscal y comercial"
          icon={Building2}
        >
          <SESFormRow>
            <SESField label="Proveedor" required className="col-span-12 md:col-span-6">
              <SESSelect>
                <option>Trafigura Argentina S.A.</option>
                <option>YPF S.A.</option>
              </SESSelect>
            </SESField>

            <SESField label="CUIT" className="col-span-12 md:col-span-3">
              <SESInput readOnly value="30-70896325-6" />
            </SESField>
            <SESField label="Condición IVA" className="col-span-12 md:col-span-3">
              <SESInput readOnly value="Responsable Inscripto" />
            </SESField>
          </SESFormRow>
        </SESSection>

        <SESSection
          variant="premium"
          title="Comprobante"
          subtitle="Tipo, numeración, fechas y período fiscal"
          icon={FileText}
        >
          <SESBadgeGroup>
            <SESBadge>Borrador</SESBadge>

            <SESBadge variant="success">Confirmado</SESBadge>

            <SESBadge variant="warning">Pendiente</SESBadge>

            <SESBadge variant="danger">Anulado</SESBadge>

            <SESBadge variant="info">AFIP</SESBadge>
          </SESBadgeGroup>

          <SESFormRow>
            <SESField label="Tipo" required className="col-span-12 md:col-span-3">
              <SESSelect>
                <option>Factura A</option>
                <option>Nota de Crédito A</option>
                <option>Remito</option>
              </SESSelect>
            </SESField>

            <SESField label="Pto. venta" required className="col-span-12 md:col-span-2">
              <SESNumberInput value={1} decimals={0} />
            </SESField>

            <SESField label="Número" required className="col-span-12 md:col-span-3">
              <SESNumberInput value={1524} decimals={0} />
            </SESField>

            <SESField label="Fecha emisión" className="col-span-12 md:col-span-2">
              <SESDatePicker value="2026-08-07" />
            </SESField>

            <SESField label="Período fiscal" className="col-span-12 md:col-span-2">
              <SESSelect>
                <option>07/2026</option>
                <option>06/2026</option>
                <option>05/2026</option>
              </SESSelect>
            </SESField>
          </SESFormRow>
        </SESSection>
        <SESSection
          variant="premium"
          title="Ítems del comprobante"
          subtitle="Artículos, cantidades, costos e impuestos"
          icon={Package}
        >
          <SESToolbar>
            <SESToggleGroup
              value={modoIngreso}
              onChange={setModoIngreso}
              options={[
                { value: "detallado", label: "Detallado" },
                { value: "simplificado", label: "Simplificado" },
              ]}
            />

            <SESButton variant="secondary">Agregar concepto</SESButton>

            <SESSearchBox
              className="flex-1 max-w-sm"
              placeholder="Buscar artículo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onSearch={(texto) => console.log("Buscar:", texto)}
            />

            <SESButtonGroup className="ml-auto">
              <SESIconButton icon={RefreshCw} label="Actualizar" />
              <SESIconButton icon={Trash2} label="Eliminar" variant="danger" />
            </SESButtonGroup>
          </SESToolbar>

          <SESTable>
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Artículo</th>
                <th className="px-4 py-3 text-right font-medium">Cant.</th>
                <th className="px-4 py-3 text-right font-medium">Costo</th>
                <th className="px-4 py-3 text-right font-medium">IVA</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 font-medium text-slate-800">NAFTA SUPER PUMA</td>
                <td className="px-4 py-3 text-right">5.201,54</td>
                <td className="px-4 py-3 text-right">$ 1.180,000</td>
                <td className="px-4 py-3 text-right">$ 1.288.941</td>
                <td className="px-4 py-3 text-right font-semibold">$ 7.424.492</td>
              </tr>

              <tr>
                <td className="px-4 py-3 font-medium text-slate-800">
                  GASEOSA COCA COLA 1.5L
                </td>
                <td className="px-4 py-3 text-right">12</td>
                <td className="px-4 py-3 text-right">$ 2.818,000</td>
                <td className="px-4 py-3 text-right">$ 7.101</td>
                <td className="px-4 py-3 text-right font-semibold">$ 40.902</td>
              </tr>
            </tbody>
          </SESTable>
        </SESSection>

        <SESSection
          variant="premium"
          title="Resumen"
          subtitle="Totales, IVA, tributos y verificación final"
          icon={Calculator}
        >
          <SESSummary>
            <SESSummary.Item label="Neto gravado" value="$ 6.171.633,200" />

            <SESSummary.Item label="IVA" value="$ 1.296.042,972" />

            <SESSummary.Item label="Imp. Interno" value="$ 1.753.282,700" />

            <SESSummary.Total label="Total comprobante" value="$ 9.220.958,872" />
          </SESSummary>
        </SESSection>
        <SESCheckbox label="Actualizar stock" />
        <SESActionBar align="end">
          <SESButton variant="ghost">Cancelar</SESButton>
          <SESButton variant="secondary">Guardar borrador</SESButton>
          <SESButton variant="primary">Confirmar comprobante</SESButton>
        </SESActionBar>
      </SESWorkspace>
    </SESPage>
  );
}
