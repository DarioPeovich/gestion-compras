# v1.1.0 — 18/07/2026

## Consolidación del Frontend v1

### Agregado

- Infraestructura global de Feedback mediante `SESToast`, `SESToastProvider`, `sesToastContext` y `useSESToast`.
- API reutilizable `showToast({ type, message, duration })` y aviso global ante errores de validación, conservando los errores locales.
- `SESConfirmDialog` controlado, accesible y reutilizable, con variantes `default` y `danger`.
- Cancelación inteligente de `NuevoComprobante` mediante la derivación `tieneDatosIngresados`, sin dirty flag mantenido por efectos.

### Cambiado

- Se estabilizó `NuevoComprobante` como orquestador de secciones SES.
- Se centralizó la configuración por categoría mediante `CONFIG_CATEGORIAS` y `CONFIG_CATEGORIA_INICIAL`.
- Se extrajeron validaciones específicas para Facturas, datos fiscales y documentos con ítems, preservando Remitos y documentos sin ítems.
- Se especializó la presentación de ítems mediante `SESItemsFactura` y `SESItemsRemito`.
- `sumaCalculada` dejó de depender de `ivaFilas` en modo detallado y utiliza directamente el IVA de los ítems; el modo simplificado conserva la base y el IVA de sus filas manuales.
- El flujo frontend de Remitos quedó específico, no valorizado y conectado exclusivamente con `POST /api/remitos/registrar`.
- Cancelar sale directamente cuando el formulario está limpio y solicita confirmación mediante `SESConfirmDialog` cuando existen datos significativos.

### Corregido

- Total Factura vacío, cero o negativo bloquea la confirmación de Facturas y Notas de Crédito.
- Se controla la diferencia entre `totalManual` y `sumaCalculada` con tolerancia absoluta de 0,05.
- El toast global se ubica debajo de la barra superior para mejorar su perceptibilidad.
- Remitos presentan encabezado, secciones, acción de confirmación y controles de recepción propios, sin totales fiscales.

### Validación

- ESLint correcto en `SESConfirmDialog.jsx` y `SESFooterActions.jsx`; `NuevoComprobante.jsx` conserva errores preexistentes fuera del alcance.
- `git diff --check` correcto.
- Build local exitoso con Vite 8.0.16 y 1875 módulos transformados; `npm run build` continúa afectado por una instalación externa conocida de npm.
- Prueba interactiva completa de `SESConfirmDialog` pendiente a cargo del operador.

---

# v1.0.3 — 15/07/2026

## Remitos de Compra — Integración completa

### Backend

- Se implementó el endpoint independiente `POST /api/remitos/registrar`.
- Los remitos dejaron de utilizar la persistencia de comprobantes.
- Se agregó persistencia en `compras_remitos`.
- Se agregó persistencia en `compras_remitos_detalle`.
- Validación de duplicados por:
  - proveedor
  - punto de venta
  - número de remito
- Integración con WinDev para actualización de stock.
- Implementación completa del protocolo de idempotencia mediante `operacionID`.
- Confirmación mediante consulta al endpoint de recuperación.

### Frontend

- Se incorporó un flujo específico para Remitos.
- Adaptación de la pantalla NuevoComprobante.
- Ocultamiento de información fiscal e impositiva.
- Confirmación específica "Confirmar remito".
- Selección obligatoria de sucursal y depósito.
- Buscador de artículos renderizado mediante Portal (`createPortal`).

### Integración

Se validó completamente el flujo:

React

↓

Node

↓

PostgreSQL

↓

WinDev

↓

HFSQL

↓

Confirmación

### Estado

Remitos de Compra quedan funcionalmente finalizados en su versión 1.0.
