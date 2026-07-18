# ROADMAP

Última actualización:
2026-07-18

Versión del producto:
Compras v1.1.0

Próximo objetivo:
Órdenes de Compra

Estado general:
🟡 Desarrollo activo

Este documento describe la evolución prevista del proyecto SES Compras.

No representa un backlog detallado, sino la hoja de ruta funcional del producto.

Cada etapa puede contener uno o varios sprints de implementación.

---

# Estado actual

Versión del módulo: Compras v1.1.0

## Finalizado

✔ Arquitectura general

✔ Modelo de datos

✔ Sincronización de proveedores

✔ Sincronización de artículos

✔ NuevoComprobante

✔ Facturas

✔ Notas de Crédito

✔ Notas de Débito

✔ Remitos

✔ Integración Node ↔ WinDev

✔ Protocolo de idempotencia

✔ Documentación base

✔ Consolidación estructural del Frontend v1

---

# Etapa 1

Consolidación del Frontend

Objetivo

Reducir deuda técnica surgida durante la implementación inicial.

Incluye

- ✔ Limpieza condicional y constantes derivadas
- ✔ Configuración centralizada por categorías
- ✔ Validaciones específicas extraídas
- ✔ Especialización `SESItemsFactura` / `SESItemsRemito`
- ✔ Consolidación del frontend de Remitos
- ✔ Estabilización de `sumaCalculada`
- ✔ Validación de Total Factura
- ✔ Infraestructura global `SESToast`
- ✔ `SESConfirmDialog`
- ✔ Cancelación inteligente

Estado

✔ Consolidación estructural finalizada

Mejoras incrementales pendientes

- Búsqueda de artículos por Código SES, endpoint WinDev y mensaje visual de error.
- Presentación de alícuota IVA 10,50 %.
- Validación de motivo, numeración automática y cuenta corriente de NC/ND internas.
- Sustitución del `window.confirm` del cambio de modo detallado/simplificado.
- Confirmación definitiva del mapeo del id de artículo en Remitos.
- Asociación de Remitos con Facturas y Órdenes de Compra.
- Reversa o anulación de stock y compensación de resultados inciertos de WinDev.
- Documentación detallada del frontend y documentación final DOCX.

Validación

- Build e inspección técnica completados.
- Prueba interactiva completa de `SESConfirmDialog` pendiente a cargo del operador.

Deuda técnica externa — WinDev

- El mantenimiento de artículos debe garantizar `ICL + IDC = Impuesto Interno` cuando existe desglose.
- Si ICL e IDC están vacíos o en cero, Impuesto Interno puede conservar un valor independiente.
- SES Compras no clasifica combustibles: utiliza `ICL + IDC` cuando la suma es positiva y `imp_interno_monto` en caso contrario.

---

# Etapa 2

Órdenes de Compra

Objetivo

Implementar el flujo documental de generación y administración de órdenes de compra.

Estado

⚪ No iniciado

---

# Etapa 3

Recepciones

Objetivo

Registrar recepciones parciales y su asociación con órdenes de compra y remitos.

Estado

⚪ No iniciado

---

# Etapa 4

Cuenta Corriente

Estado

⚪ No iniciado

---

# Etapa 5

Pagos a Proveedores

Estado

⚪ No iniciado

---

# Etapa 6

OCR

Estado

⚪ No iniciado

---

# Etapa 7

Libro IVA Compras

Estado

⚪ No iniciado

---

# Largo plazo

- Multiempresa
- Auditoría avanzada
- Dashboard operativo
- Reportes
- BI
