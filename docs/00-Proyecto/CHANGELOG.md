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
