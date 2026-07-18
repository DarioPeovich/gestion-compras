# Estado actual del proyecto

Versión vigente: **Compras v1.1.0**

Última actualización: **18/07/2026**

## Backend

Estado aproximado: **80 %**

### Funcionalidades implementadas

- Sincronización de Proveedores
- Sincronización de Artículos
- Caché local PostgreSQL
- Tipos de comprobantes
- Facturas
- Notas de Crédito
- Notas de Débito
- Remitos
- Actualización de costos
- Actualización de stock
- Integración Node ↔ WinDev
- Protocolo de idempotencia

### Pendiente

- Órdenes de Compra
- Recepciones
- Cuenta Corriente
- Pagos
- OCR
- Libro IVA Compras

---

## Frontend

Estado: **Consolidación del frontend v1 finalizada**

### Implementado

- Arquitectura de `NuevoComprobante` estabilizada como orquestador de secciones SES
- Configuración centralizada por categoría y encabezados dinámicos
- Validaciones específicas extraídas, preservando Remitos y documentos sin ítems
- Especialización `SESItemsFactura` / `SESItemsRemito` mediante `SESItemsSection`
- SES Design System organizado por Forms, Data, Actions, Layout, Feedback y Navigation
- Feedback: `SESBadge`, `SESBadgeGroup`, `SESToast` y `SESConfirmDialog`
- Facturas
- Notas de Crédito
- Notas de Débito
- Remitos con flujo frontend específico y no valorizado
- Buscador de artículos mediante Portal
- Control obligatorio de Total Factura para Facturas y Notas de Crédito
- Comparación de `totalManual` contra `sumaCalculada` con tolerancia absoluta de 0,05
- Cancelación inteligente basada en datos significativos ingresados

### Arquitectura de NuevoComprobante

`NuevoComprobante` conserva el estado, los cálculos, las validaciones y el submit, y coordina:

- `SESProveedorSection`
- `SESComprobanteSection`
- `SESItemsSection`, con vistas especializadas `SESItemsFactura` y `SESItemsRemito`
- `SESResumenSection`
- `SESFooterActions`

La arquitectura se considera estabilizada para el frontend v1, sin impedir evoluciones incrementales posteriores.

### Remitos

El frontend de Remitos está finalizado para su alcance actual:

- punto de venta y número de remito;
- encabezado y secciones específicas;
- mercadería recibida sin totales ni valorización fiscal;
- acción `Confirmar remito`;
- uso exclusivo de `POST /api/remitos/registrar`;
- sucursal, depósito y actualización obligatoria de stock;
- Cancelar disponible durante todo el flujo.

La asociación con Facturas u Órdenes de Compra y la reversa o compensación de stock no forman parte de este cierre.

### Total Factura

En modo detallado, `sumaCalculada` utiliza `subtotalNeto` e IVA directo de los ítems. En modo simplificado utiliza la base y el IVA de las filas manuales. Esto reduce la dependencia de estado derivado potencialmente desactualizado.

Para Facturas y Notas de Crédito, Total Factura es obligatorio, debe ser positivo y debe coincidir con `sumaCalculada` dentro de una tolerancia absoluta de 0,05. `totalManual` actúa como control final contra el comprobante físico o informado por el proveedor. La regla no aplica a Remitos no valorizados.

### Feedback y cancelación

- `SESToastProvider` está integrado globalmente y mantiene el aviso general junto con los errores locales de validación. Los toast se presentan debajo de la barra superior. Los `alert` existentes no fueron migrados en su totalidad.
- `SESConfirmDialog` es un diálogo controlado de Feedback, con variantes `default` y `danger`, overlay, semántica accesible, cierre con Escape y foco inicial en la acción segura.
- `NuevoComprobante` deriva `tieneDatosIngresados` sin mantener un dirty flag mediante efectos.
- La detección considera proveedor, numeración, fechas o período modificados, selección manual de tipo cuando corresponde, cambio de modo, ítems, conceptos, filas IVA significativas, tributos, importes, motivo, stock y sucursal seleccionada por el operador.
- Se excluyen categoría, fechas y período iniciales automáticos, tipo o depósito autoasignados, sucursal inicial de contexto, fila IVA técnica vacía, IVA derivado de ítems, listas maestras, carga, errores y valores calculados.
- Con el formulario limpio, Cancelar ejecuta `onCancelar` directamente. Con datos significativos, `SESFooterActions` abre el diálogo y permite continuar cargando o confirmar la salida.
- El `window.confirm` de Cancelar fue eliminado. El correspondiente al cambio de modo detallado/simplificado permanece pendiente.

### Validación técnica

- ESLint correcto en `SESConfirmDialog.jsx` y `SESFooterActions.jsx`.
- `NuevoComprobante.jsx` conserva errores preexistentes fuera del alcance de esta consolidación.
- `git diff --check` correcto.
- `npm run build` afectado por una instalación externa conocida de npm.
- Build local exitoso con Vite 8.0.16: 1875 módulos transformados.
- Implementación validada mediante build e inspección; prueba interactiva completa de `SESConfirmDialog` pendiente a cargo del operador.

### Pendiente

- Búsqueda de artículos por Código SES y endpoint WinDev correspondiente.
- Mensaje visual de error en búsquedas de artículos.
- Presentación de alícuota IVA 10,50 %.
- Validación funcional de motivo obligatorio y numeración interna automática para NC/ND internas.
- Movimientos de cuenta corriente para notas internas.
- Sustitución del `window.confirm` del cambio de modo.
- Confirmación definitiva del mapeo del id de artículo en Remitos.
- Asociación de Remitos con Facturas y Órdenes de Compra.
- Reversa o anulación de stock en WinDev.
- Reintentos o compensación de operaciones con resultado incierto.
- Órdenes de Compra, Recepciones, Cuenta Corriente y Pagos a Proveedores.
- OCR y Libro IVA Compras.
- Documentación detallada del frontend y documentación final DOCX.

---

## Integración Node ↔ WinDev

El flujo React → Node → PostgreSQL → WinDev → HFSQL está operativo para Remitos, con idempotencia y consulta de recuperación. Permanecen pendientes la reversa o anulación de stock y los mecanismos automáticos de reintento o compensación ante resultados inciertos.

## Deuda técnica externa — WinDev

El mantenimiento de artículos en WinDev debe validar que, cuando ICL o IDC poseen valores, `ICL + IDC = Impuesto Interno`. Si ambos están vacíos o en cero, Impuesto Interno puede conservar un valor independiente.

Esta clasificación pertenece a WinDev: SES Compras no debe determinar si un artículo es combustible. SES utiliza `ICL + IDC` cuando su suma es mayor que cero y `imp_interno_monto` en caso contrario.
