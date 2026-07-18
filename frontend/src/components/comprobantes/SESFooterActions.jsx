import { useCallback, useState } from "react";

import SESButton from "../ui/actions/SESButton";
import SESConfirmDialog from "../ui/feedback/SESConfirmDialog";
import SESActionBar from "../ui/layout/SESActionBar";

export default function SESFooterActions({
  onCancelar,
  handleConfirmar,
  cargando,
  tieneDatosIngresados,
  confirmarLabel = "Confirmar comprobante",
}) {
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);

  const cerrarConfirmacion = useCallback(() => {
    setConfirmacionAbierta(false);
  }, []);

  const handleCancelar = () => {
    if (cargando) return;

    if (!tieneDatosIngresados) {
      onCancelar();
      return;
    }

    setConfirmacionAbierta(true);
  };

  const confirmarCancelacion = () => {
    setConfirmacionAbierta(false);
    onCancelar();
  };

  return (
    <>
      <SESActionBar align="end">
        <SESButton variant="secondary" onClick={handleCancelar} disabled={cargando}>
          Cancelar
        </SESButton>
        <SESButton variant="primary" onClick={handleConfirmar} disabled={cargando}>
          {cargando ? "Guardando..." : confirmarLabel}
        </SESButton>
      </SESActionBar>

      <SESConfirmDialog
        open={confirmacionAbierta}
        title="Cancelar comprobante"
        message="Hay datos ingresados que se perderán. ¿Deseás cancelar igualmente?"
        confirmLabel="Sí, cancelar"
        cancelLabel="Continuar cargando"
        variant="danger"
        loading={cargando}
        onConfirm={confirmarCancelacion}
        onCancel={cerrarConfirmacion}
      />
    </>
  );
}
