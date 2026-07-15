import SESButton from "../ui/actions/SESButton";
import SESActionBar from "../ui/layout/SESActionBar";

export default function SESFooterActions({
  onCancelar,
  handleConfirmar,
  cargando,
  confirmarLabel = "Confirmar comprobante",
}) {
  const handleCancelar = () => {
    if (
      window.confirm(
        "Se perderán los datos ingresados. ¿Deseás cancelar el comprobante?"
      )
    ) {
      onCancelar();
    }
  };

  return (
    <SESActionBar align="end">
      <SESButton variant="secondary" onClick={handleCancelar} disabled={cargando}>
        Cancelar
      </SESButton>
      <SESButton variant="primary" onClick={handleConfirmar} disabled={cargando}>
        {cargando ? "Guardando..." : confirmarLabel}
      </SESButton>
    </SESActionBar>
  );
}
