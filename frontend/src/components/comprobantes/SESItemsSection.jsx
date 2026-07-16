import SESItemsFactura from "./SESItemsFactura.jsx";
import SESItemsRemito from "./SESItemsRemito.jsx";

export default function SESItemsSection(props) {
  if (props.esRemito) {
    return <SESItemsRemito {...props} />;
  }

  return <SESItemsFactura {...props} />;
}
