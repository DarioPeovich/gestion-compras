# SES Compras — Consolidación del Frontend v1

**Estado:** consolidación estructural finalizada; mejoras incrementales pendientes  
**Versión:** Compras v1.1.0  
**Actualización:** 18/07/2026  
**Alcance:** `NuevoComprobante` y componentes asociados del frontend de SES Compras

## 1. Propósito y alcance

Este documento registra la arquitectura resultante de la consolidación del frontend v1 de SES Compras. El trabajo ordenó el flujo de alta de comprobantes, especializó las experiencias de Facturas y Remitos, centralizó decisiones por categoría y agregó infraestructura común de Feedback.

La consolidación fue necesaria porque la incorporación progresiva de categorías, reglas fiscales y Remitos había distribuido condiciones funcionales entre el render, la validación y la persistencia. El objetivo no fue reducir líneas de código como fin en sí mismo, sino hacer visibles las responsabilidades y establecer límites mantenibles.

`NuevoComprobante` se considera una arquitectura estabilizada y preparada para evolución incremental. Esto significa que deja de estar en refactor estructural permanente, no que sea inmutable. Nuevos tipos documentales o reglas pueden incorporarse respetando la composición, la configuración y los puntos de extensión existentes.

El alcance cubre el formulario de nuevo comprobante, sus secciones, los modos de ingreso, la validación previa, los flujos frontend de persistencia, Remitos y los componentes `SESToast` y `SESConfirmDialog`. Quedan fuera la arquitectura interna del backend, el modelo PostgreSQL, la implementación WinDev/HFSQL, los módulos futuros y la documentación de despliegue.

## 2. Contexto arquitectónico

El frontend utiliza React sobre Vite, Tailwind CSS y un Design System propio denominado SES. React mantiene el estado y compone las vistas; Vite resuelve desarrollo y build; Tailwind aporta las primitivas visuales; los componentes SES normalizan formularios, acciones, layout y feedback.

La comunicación funcional sigue esta frontera:

```text
Frontend React
    ↓ HTTP/JSON
Backend Node/Express
    ↓ cuando corresponde
WinDev / HFSQL
```

El frontend no accede directamente a WinDev ni a HFSQL. Consume el backend Node mediante una base configurada por `VITE_API_URL`, con fallback local a `http://localhost:3000/api`. Las reglas de persistencia, idempotencia e integración externa permanecen detrás de esa API.

## 3. Arquitectura final de NuevoComprobante

La composición principal es:

```text
NuevoComprobante
├── SESComprobanteSection
│   └── SESProveedorSection
├── SESItemsSection
│   ├── SESItemsFactura
│   └── SESItemsRemito
├── SESResumenSection
└── SESFooterActions
    └── SESConfirmDialog
```

En el JSX real, `SESProveedorSection` se renderiza dentro de la sección documental después de que existe un tipo aplicable. La representación anterior expresa responsabilidades, no obliga a que cada nodo sea un contenedor DOM independiente.

`NuevoComprobante` es el orquestador. Conserva intencionalmente el estado principal, los maestros obtenidos desde la API, los cálculos, las validaciones, la construcción de payloads y la selección del endpoint. También deriva la configuración activa y decide qué secciones montar. Es el punto de composición visual mediante `SESWorkspace` y `SESSection`.

`SESComprobanteSection` captura categoría, letra o tipo, numeración, fecha de emisión, vencimiento y período fiscal cuando aplican. `SESProveedorSection` selecciona el proveedor y presenta CUIT y condición de IVA asociados.

`SESItemsSection` es un selector mínimo: monta una sola vista según `esRemito`. `SESItemsFactura` presenta el ingreso valorizado y fiscal; `SESItemsRemito` presenta mercadería recibida. `SESResumenSection` muestra el resumen fiscal de comprobantes o, en Remitos, la recepción con sucursal y depósito. `SESFooterActions` concentra las acciones Confirmar y Cancelar y es propietario visual del diálogo de cancelación.

Las responsabilidades extraídas son principalmente captura, presentación y decisión visual. El estado y las reglas transversales no se trasladaron indiscriminadamente a componentes hijos, evitando duplicar fuentes de verdad.

## 4. Clasificación por responsabilidad

La clasificación SES describe la responsabilidad del componente, no la etiqueta HTML que finalmente renderiza.

| Responsabilidad | Finalidad | Componentes relevantes del flujo |
| --- | --- | --- |
| Forms | Capturar información | `SESField`, `SESInput`, `SESSelect`, `SESDatePicker`, `SESNumberInput`, `SESCheckbox`, `SESToggleGroup`, `SESComprobanteSection`, `SESProveedorSection` |
| Data | Presentar información estructurada | filas de ítems, resúmenes fiscales y componentes SES de datos reutilizados por el módulo |
| Actions | Ejecutar acciones | `SESButton`, `SESIconButton`, `SESFooterActions` |
| Layout | Organizar la pantalla | `SESWorkspace`, `SESSection`, `SESFormRow`, `SESToolbar`, `SESActionBar` |
| Feedback | Comunicar estado o solicitar decisiones | `SESBadge`, `SESBadgeGroup`, `SESToast`, `SESToastProvider`, `SESConfirmDialog` |
| Navigation | Desplazar al usuario por el sistema | router y navegación general, fuera de la lógica interna del formulario |

Esta clasificación es conceptual. La consolidación no reorganizó físicamente todo el árbol de carpetas.

## 5. Configuración centralizada por categoría

`CONFIG_CATEGORIAS` reúne la variación estable de las categorías reales: Factura, Nota de Crédito, Nota de Débito, Remito, Nota de Crédito Interna y Nota de Débito Interna. `CONFIG_CATEGORIA_INICIAL` define el estado visual y funcional previo a una selección.

Las propiedades verificadas son:

- `filtroTipo`: selecciona los tipos backend compatibles con la categoría.
- `llevaItems`: determina si el documento utiliza la sección de ítems.
- `permiteSimplificado`: declara si la categoría admite conceptualmente el modo simplificado.
- `esRemito`: habilita el flujo específico de Remitos.
- `encabezado`: aporta título y subtítulo del workspace.
- `seccionDocumento`: aporta título y subtítulo de la sección documental.

Factura y Nota de Crédito llevan ítems y admiten ingreso simplificado. Nota de Débito y las notas internas se modelan como documentos sin ítems en este flujo. Remito lleva ítems, no admite simplificado y activa su presentación y persistencia específicas.

La configuración evita repetir comparaciones de textos en múltiples zonas y mantiene alineados encabezado, tipo, presencia de ítems y especialización de Remitos. No elimina todas las condiciones: las reglas que dependen del estado operativo continúan expresadas mediante derivados y validadores.

## 6. Constantes derivadas y limpieza condicional

El componente obtiene conceptos funcionales a partir del estado actual:

- `configCategoria`: configuración activa o inicial.
- `tiposFiltrados` y `tipoSeleccionado`: opciones y tipo efectivo.
- `llevaItems` y `esRemito`: capacidades documentales.
- `usaIngresoDetallado` y `usaIngresoSimplificado`: modo activo.
- `muestraFormularioSinItems`: habilita motivo e importe para documentos sin ítems.
- `muestraResumen`: decide la presencia del resumen fiscal o de recepción.
- `muestraTotalSinItems`: presenta el total de documentos sin ítems cuando corresponde.
- `tieneDatosIngresados`: decide si Cancelar necesita confirmación.

Estas constantes traducen combinaciones técnicas a vocabulario del dominio y reducen condiciones repetidas en el JSX. `esComprobanteFiscal` no forma parte de la implementación vigente: los puntos que necesitan esa propiedad consultan actualmente `tipoSeleccionado?.cbte_fiscal`.

## 7. Especialización de ítems

`SESItemsSection` conserva un contrato público único y monta exclusivamente `SESItemsRemito` cuando `esRemito` es verdadero; en los demás casos monta `SESItemsFactura`. Esta capa permite que `NuevoComprobante` no conozca detalles de presentación de cada grilla.

`SESItemsFactura` ofrece modo detallado y simplificado. En detallado integra `BuscadorArticulos`, transforma el artículo seleccionado al modelo del formulario, permite conceptos manuales, cantidades, costo actual, costo facturado, IVA, ICL, IDC, Impuesto Interno y actualización de costo. Los ítems poseen `_uid` para identidad visual y se eliminan por índice conservando el comportamiento original.

`SESItemsRemito` utiliza el mismo buscador y conserva la transformación necesaria para el contrato de Remitos. Presenta código, descripción, cantidad y costo cuando está disponible. No permite conceptos manuales ni selector de modo y no muestra IVA, tributos o totales. El costo opcional puede conservarse y enviarse, pero el documento no presenta un total económico ni se trata como comprobante fiscal valorizado.

Sucursal, depósito y actualización obligatoria de stock no pertenecen a la grilla: se presentan en la rama Remito de `SESResumenSection`. Esta separación mantiene la mercadería en la sección de ítems y el destino de recepción en el resumen operativo.

Volver a una sola vista con condiciones por cada columna mezclaría nuevamente modelos funcionales diferentes. El selector común debe permanecer pequeño y las diferencias deben evolucionar dentro de cada vista especializada.

### Artículos repetidos y actualización única del costo

Un comprobante de compra puede contener varias líneas correspondientes al mismo artículo. Esta situación es válida y debe permitirse porque puede representar promociones, bonificaciones, unidades sin cargo, descuentos comerciales o distintas condiciones económicas informadas por el proveedor para un mismo artículo.

Son casos válidos, entre otros:

- 20 unidades a precio normal y 5 unidades bonificadas;
- 10 unidades a precio normal y 10 unidades con descuento del 15 %;
- 8 unidades a precio normal y 2 unidades a $0,01;
- cualquier otra combinación de líneas informada por el proveedor.

Todas las líneas repetidas participan normalmente en cantidades, stock, impuestos y total del comprobante. No se consolidan ni se sobrescriben automáticamente: cada una conserva su identidad y sus condiciones económicas dentro del detalle.

La actualización del precio de costo es una decisión explícita y opcional del operador. Para cada artículo puede haber cero o una línea marcada con `Actualizar precio costo`; nunca pueden coexistir dos líneas marcadas para el mismo artículo. Al seleccionar otra línea válida del mismo artículo, el cambio se realiza de forma atómica y se desmarca la selección anterior.

Una línea sólo puede actualizar el costo cuando su precio es mayor que cero. Si existen varias líneas positivas del mismo artículo con precios diferentes, la línea seleccionada debe tener un precio superior al 10 % del mayor precio positivo del grupo. Cuando todas las líneas positivas tienen el mismo precio, puede elegirse cualquiera de ellas, manteniendo siempre el límite de una sola selección. Los precios no positivos y los precios simbólicos que no superan ese umbral son rechazados mediante el mecanismo de mensajes vigente.

Antes del envío al backend se ejecuta una validación final defensiva de estas reglas. La selección de `Actualizar precio costo` no modifica cantidades, stock, impuestos, subtotales ni total, y permanece independiente de la validación entre `Total Factura` y la suma calculada.

## 8. Modos de ingreso

El estado inicial es `detallado`. Sólo las categorías configuradas para el flujo valorizado exponen el selector entre detallado y simplificado; Remitos y documentos sin ítems no comparten ambos modos.

En modo detallado, los artículos o conceptos forman la fuente del subtotal y del IVA. Cada modificación recalcula la línea; el IVA agrupado se mantiene para presentación, pero no es la fuente principal de la suma económica.

En modo simplificado no se cargan artículos. Las filas de IVA contienen base imponible, tipo de IVA e importe calculado, y el resumen permite ingresar los tributos correspondientes. Al entrar al modo puede crearse una primera fila técnica vacía con el primer tipo de IVA disponible.

El cambio de modo restablece ítems, IVA, tributos, Total Factura y fechas administradas por `resetForm`. Si existen ítems, todavía utiliza `window.confirm` antes de descartarlos. Su migración a una confirmación SES permanece como mejora conocida.

## 9. Flujo de validación

El recorrido es:

```text
handleConfirmar()
    ↓ await validar()
validaciones comunes y especializadas
    ├── inválido → setErrores + SESToast + bloqueo
    └── válido   → construcción y envío del payload
```

`validarCamposComunes` exige tipo, proveedor y fecha válida no futura. `validarFactura` exige vencimiento para Facturas y controla que no sea anterior a la emisión. `validarDatosFiscales` valida período, punto de venta y número cuando el tipo es fiscal.

`validarDocumentoConItems` controla ítems o filas simplificadas, descripción de conceptos manuales, subtotal, Total Factura y su concordancia. `validarDocumentoSinItems` exige un importe positivo. `validarStockOpcional` controla sucursal y depósito cuando un comprobante valorizado actualiza stock. `validarDuplicado` consulta el endpoint de verificación para comprobantes fiscales.

Remitos siguen una salida especializada mediante `validarRemito`: proveedor, numeración, fecha, sucursal, depósito y artículos reales válidos. Después de reunir los errores, `validar` ejecuta `setErrores` y devuelve un booleano.

Los mensajes locales permanecen asociados a cada campo mediante `errores` y `ErrMsg`. Cuando el resultado es inválido, `handleConfirmar` agrega el toast “Revisá los campos marcados antes de confirmar”. El toast complementa la ubicación precisa de los errores; no los reemplaza ni altera las reglas.

## 10. Suma calculada

La fuente efectiva depende del modo:

- Detallado: `baseEfectiva = subtotalNeto` e `ivaEfectivo = totalIvaItems`, sumado directamente desde `item.importe_iva`.
- Simplificado: `baseEfectiva = totalBaseFilas` e `ivaEfectivo = totalIvaFilas`.

La fórmula vigente agrega a esa base e IVA el tratamiento efectivo de ICL/IDC o Impuesto Interno y las percepciones de IIBB y municipales:

```text
sumaCalculada =
  base efectiva
  + IVA efectivo
  + ICL + IDC
  + Impuesto Interno cuando no está representado por ICL/IDC
  + percepción IIBB
  + percepción municipal
```

En detallado, depender de `ivaFilas` para la suma principal introducía una ventana en la que el efecto encargado de sincronizar ese estado podía no haber reflejado todavía el último cambio de ítems. Calcular desde los ítems reduce ese riesgo. En simplificado, las filas son la entrada primaria y por eso continúan siendo la fuente adecuada.

## 11. Control del Total Factura

`totalManual` representa el campo “Total factura” de Facturas y Notas de Crédito con ítems. Es obligatorio y debe ser finito y mayor que cero. Luego se compara contra `sumaCalculada`:

```text
abs(totalManual - sumaCalculada) <= 0,05
```

Una diferencia absoluta mayor que 0,05 genera un error local y bloquea la confirmación. La tolerancia absorbe diferencias menores de redondeo sin convertir el control en una igualdad binaria de punto flotante.

Funcionalmente, Total Factura es la referencia externa contra el documento físico o informado por el proveedor. No es un sustituto del cálculo ni se usa para corregirlo silenciosamente. Tampoco se aplica a Remitos no valorizados y no debe confundirse con `importeTotal`, que corresponde a Notas de Débito o notas internas sin ítems.

## 12. Flujo de Remitos

La categoría Remito activa el encabezado “Nuevo remito”, la sección “Datos del remito”, la grilla “Mercadería recibida”, la sección “Recepción” y la acción “Confirmar remito”. Solicita proveedor, punto de venta, número, fecha, sucursal, depósito y al menos un artículo real.

No presenta vencimiento, período fiscal, IVA, percepciones, tributos, Total Factura ni suma calculada. Tampoco permite modo simplificado o conceptos manuales. La recepción indica que la actualización de stock es obligatoria.

Tras la validación se construye un payload propio y se envía exclusivamente a `POST /api/remitos/registrar`. Los ítems incluyen identificación HFSQL, código, descripción, cantidad y costo opcional cuando existe. Este flujo no reutiliza `POST /api/comprobantes/registrar`.

La respuesta exitosa requiere `ok` e id del Remito. El frontend presenta el identificador y, cuando está disponible, `operacionID`, utilizado por el contrato de integración e idempotencia. En errores se prioriza `detalle`, luego `error` y finalmente un mensaje HTTP genérico. Los `alert` de resultado todavía permanecen.

Después del éxito se ejecuta `onCancelar`, que devuelve la vista a la lista. Permanecen fuera del alcance actual la asociación con Facturas y Órdenes de Compra, la reversa de stock, la compensación o reintento automático ante resultados inciertos y la confirmación definitiva del mapeo del id de artículo.

## 13. Feedback global con SESToast

La infraestructura está formada por:

- `sesToastContext`: única instancia de React Context.
- `useSESToast`: acceso controlado al contexto; falla explícitamente fuera del provider.
- `SESToastProvider`: administra estado, identificadores, temporizadores y render global.
- `SESToast`: presenta mensaje, variante y cierre manual.

`main.jsx` monta `SESToastProvider` alrededor de `App`, dentro de `QueryClientProvider`, por lo que el feedback está disponible en las rutas descendientes. La API conceptual es:

```js
showToast({ type, message, duration })
```

El provider admite `error`, `success`, `warning` e `info`, usa 4500 ms como duración predeterminada y soporta varios mensajes. El contenedor está fijo a la derecha, a 96 px del borde superior, debajo de `SESTopBar`, con un z-index suficiente para no quedar confundido con la cabecera.

En `NuevoComprobante`, una validación inválida llama `showToast` y conserva simultáneamente los errores locales. Esta infraestructura es reutilizable por otros módulos, pero los `alert` de registro y conexión todavía no fueron migrados.

## 14. Confirmación con SESConfirmDialog

`SESConfirmDialog` pertenece a Feedback y expone la API controlada:

```jsx
<SESConfirmDialog
  open={boolean}
  title={string}
  message={string}
  confirmLabel={string}
  cancelLabel={string}
  variant="default | danger"
  loading={boolean}
  onConfirm={function}
  onCancel={function}
/>
```

Cuando `open` es falso no renderiza contenido. Cuando es verdadero muestra overlay y panel centrado, reutiliza `SESButton` para las acciones y traduce `danger` a la variante destructiva; cualquier otra variante utiliza el botón principal.

El panel usa `role="dialog"`, `aria-modal="true"`, `aria-labelledby` y `aria-describedby`. Al abrir conserva el elemento previamente enfocado y dirige el foco a la acción segura. Escape ejecuta `onCancel` mientras no esté cargando, y el cleanup intenta restaurar el foco anterior. El overlay no tiene manejador de click, por lo que pulsar fuera no cierra una confirmación destructiva.

El componente sólo aporta infraestructura visual y accesible. `SESFooterActions` conserva la decisión funcional de cuándo abrirlo y qué ocurre al confirmar.

## 15. Cancelación inteligente

El flujo vigente es:

```text
Cancelar
├── formulario limpio
│   └── onCancelar directo
└── formulario con datos
    └── SESConfirmDialog
        ├── Continuar cargando → cerrar y conservar datos
        ├── Escape             → cerrar y conservar datos
        └── Sí, cancelar       → onCancelar y volver a la lista
```

`tieneDatosIngresados` es una constante derivada en cada render. No existe un dirty flag adicional ni un efecto dedicado a sincronizarlo. La expresión considera actividad inequívoca: proveedor, punto de venta, número, fechas con contenido, período fiscal, tipo elegido cuando hay varias opciones, modo distinto de detallado, ítems o conceptos manuales, filas IVA simplificadas con base o importe, valores no nulos de `pieOtros`, `totalManual`, motivo, `importeTotal`, actualización de stock y sucursal.

Se excluyen categoría por sí sola, listas maestras, carga, errores, valores derivados, `sumaCalculada` y `diferencia`. El tipo seleccionado automáticamente cuando existe una sola opción no activa la detección. El depósito autoasignado no se evalúa de manera independiente. Las filas IVA derivadas de ítems tampoco cuentan; en simplificado sólo cuentan base o importe distintos de cero, por lo que la fila técnica vacía queda excluida.

El código vigente inicia las fechas vacías; si una evolución introduce fechas iniciales automáticas, deberán compararse contra ese valor inicial para conservar la misma semántica. No existe actualmente una sucursal global autoasignada en este componente; `sucursalId` sólo cuenta cuando contiene una selección. Esta precisión evita documentar snapshots o autoasignaciones inexistentes.

Mientras `cargando` es verdadero, Cancelar está deshabilitado y el handler contiene además una guarda. Sólo se eliminó el `window.confirm` de Cancelar; el de cambio de modo permanece.

## 16. Flujos de persistencia

Ambos flujos comienzan con `await validar()`. Un resultado inválido bloquea el envío. Un resultado válido activa `cargando`, construye el cuerpo correspondiente y ejecuta `fetch` con JSON.

Los comprobantes fiscales e internos utilizan `POST /api/comprobantes/registrar`. El payload varía según tenga ítems detallados, resumen simplificado o sea un documento sin ítems. Puede incluir IVA manual, percepciones, tributos, actualización opcional de stock y depósito. Ante éxito se informa el comprobante registrado y se ejecuta `onCancelar`; los errores de API o conexión se informan actualmente mediante `alert`.

Los Remitos utilizan exclusivamente `POST /api/remitos/registrar`, con contrato y tratamiento de respuesta propios. Exigen actualización de stock y preservan `operacionID` en los mensajes relevantes.

La persistencia se encuentra implementada directamente dentro de `handleConfirmar`; no existe en el frontend vigente un servicio separado para estos dos envíos. Mantener la distinción de endpoints es más importante que forzar una abstracción inexistente.

## 17. Decisiones de diseño

- `NuevoComprobante` permanece como orquestador porque estado, validación y persistencia necesitan una coordinación única.
- Se extraen responsabilidades visuales y funcionales claras; no se distribuye estado sólo para reducir longitud.
- La configuración por categoría reemplaza condiciones y encabezados dispersos.
- Facturas y Remitos utilizan vistas de ítems especializadas porque sus modelos de captura son diferentes.
- `SESItemsSection` conserva una frontera pública común y monta una sola especialización.
- Los valores derivados se calculan desde la fuente primaria cuando es posible; el IVA detallado proviene de los ítems.
- Total Factura funciona como control externo y no como fuente del cálculo.
- El toast complementa los errores locales; no sustituye validación ni ubicación de campo.
- `SESConfirmDialog` pertenece al Design System; el footer decide su uso funcional.
- Cancelar sólo solicita confirmación cuando existen datos significativos.
- Remitos poseen endpoint y contrato propios y no simulan comprobantes fiscales.
- WinDev continúa siendo fuente de verdad para maestros y reglas propias de artículos.

## 18. Regla ICL, IDC e Impuesto Interno

El frontend aplica la siguiente prioridad para el impuesto interno efectivo:

```text
si ICL + IDC > 0:
    impuesto interno efectivo = ICL + IDC
en caso contrario:
    impuesto interno efectivo = imp_interno_monto
```

En la suma económica no se agregan simultáneamente ICL, IDC e Impuesto Interno cuando ICL/IDC ya representan el desglose. Esto evita doble conteo.

SES Compras no determina si el artículo es combustible ni introduce una clasificación adicional. Los valores llegan desde los maestros cuya fuente de verdad es WinDev. El mantenimiento de artículos en WinDev debe garantizar `ICL + IDC = Impuesto Interno` cuando existe desglose; si ambos están vacíos o en cero, Impuesto Interno puede conservar un valor independiente. Esa validación es deuda técnica externa y no debe resolverse con inferencias en React.

## 19. Pruebas y validación técnica

La consolidación cuenta con estas verificaciones comprobables:

- Build exitoso mediante `node_modules/.bin/vite.cmd build`, con Vite 8.0.16 y 1875 módulos transformados.
- `npm run build` falla por una instalación externa conocida de npm que no encuentra `npm-cli.js`; no es un error del bundle del proyecto.
- ESLint de `SESConfirmDialog.jsx` y `SESFooterActions.jsx` sin errores.
- `NuevoComprobante.jsx` conserva cinco errores preexistentes por actualizaciones de estado en efectos, una función `recalcularItem` sin uso y `ErrMsg` definido durante render. No fueron parte de esta etapa.
- `git diff --check` correcto al cerrar las implementaciones y la documentación rectora.

La implementación fue revisada mediante inspección y build. La prueba interactiva completa de `SESConfirmDialog` no pudo ejecutarse desde el navegador integrado porque no accedió al servidor local; permanece pendiente a cargo del operador. No se registran como realizadas pruebas visuales sin evidencia.

## 20. Estado final de la consolidación

La arquitectura del frontend v1 está estabilizada. `NuevoComprobante` deja de estar en refactor estructural: existe un orquestador definido, variaciones centralizadas, componentes de ítems especializados y primitivas comunes de Feedback.

La Etapa 1 puede considerarse estructuralmente cerrada, en concordancia con el ROADMAP. Las futuras modificaciones deberían ser incrementales y respetar los límites actuales. Esto no impide mejoras UX, correcciones funcionales puntuales ni evolución de la documentación.

## 21. Pendientes relacionados

### Mejoras UX

- Sustituir el `window.confirm` del cambio detallado/simplificado por una confirmación SES.
- Mostrar un error visual específico en búsquedas de artículos.
- Ajustar la presentación de la alícuota IVA 10,50 %.

### Pendientes funcionales

- Validar definitivamente el motivo obligatorio en NC/ND internas.
- Implementar numeración automática de notas internas.
- Incorporar movimientos de cuenta corriente para notas internas.
- Asociar Remitos con Facturas y Órdenes de Compra.

### Integraciones

- Incorporar búsqueda por Código SES y su endpoint WinDev.
- Confirmar definitivamente el mapeo del id de artículo en Remitos.
- Implementar reversa o anulación de stock.
- Definir reintentos o compensación ante resultados inciertos de WinDev.

### Documentación

- Elaborar la documentación final DOCX en una etapa separada.

### Deuda técnica externa

- Validar en el mantenimiento WinDev la coherencia entre ICL, IDC e Impuesto Interno.

## 22. Referencias

- [Estado actual del proyecto](../00-Proyecto/Estado-Actual.md)
- [CHANGELOG](../00-Proyecto/CHANGELOG.md)
- [ROADMAP](../00-Proyecto/Roadmap.md)
- [SES UI Guide](../99-Historico/Frontend/SES-UI-Guide.md)
- [Génesis del SES Design System](../99-Historico/Frontend/02-SES-Genesis.md)
- [SES Design System v1.0](../99-Historico/Frontend/03-SES-Design-System.md)
