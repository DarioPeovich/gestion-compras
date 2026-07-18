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

---

# Política de documentación

## Fuente oficial de la documentación

A partir de la versión **Compras v1.1.0**, el proyecto adopta una política documental basada en una única fuente de verdad.

### Principio

Todos los documentos **Markdown (.md)** constituyen la documentación técnica oficial del proyecto.

Toda modificación funcional, técnica, arquitectónica o de diseño deberá registrarse primero en el documento Markdown correspondiente.

### Documentos Word

Los documentos **Microsoft Word (.docx)** son exclusivamente versiones derivadas para distribución, presentación o impresión.

No deben editarse manualmente. Siempre deberán generarse a partir del contenido vigente del documento Markdown correspondiente.

### Flujo documental

```text
Cambio del proyecto
        │
        ▼
Actualización del Markdown
        │
        ▼
Revisión técnica
        │
        ▼
Generación del DOCX
```

### Objetivos

- Mantener una única fuente de verdad.
- Evitar diferencias entre las versiones Markdown y Word.
- Facilitar el versionado mediante Git.
- Simplificar el mantenimiento documental.
- Permitir regenerar documentación distribuible en cualquier momento.
- Garantizar que toda la documentación técnica permanezca sincronizada.

### Regla para futuras tareas

Toda documentación técnica del proyecto deberá seguir obligatoriamente este flujo de trabajo:

1. Crear inicialmente el documento en formato Markdown.
2. Actualizar el Markdown cuando existan cambios funcionales o técnicos.
3. Revisar técnicamente el contenido del Markdown.
4. Generar el documento DOCX a partir del Markdown vigente.
5. No editar posteriormente el DOCX de forma manual.

> Toda nueva documentación técnica deberá crearse inicialmente en formato Markdown. La generación del documento DOCX será siempre el último paso del proceso documental y nunca el primero.

Esta regla garantiza que exista una única fuente de verdad documental para todo el proyecto.

## Directriz para asistentes de IA

Cuando un asistente de IA participe en tareas documentales deberá:

- Considerar siempre el Markdown como fuente oficial.
- No modificar directamente documentos DOCX.
- Actualizar primero el Markdown antes de generar cualquier documento Word.
- Generar los DOCX utilizando el contenido vigente del Markdown.
- Mantener sincronizadas las versiones Markdown y DOCX.
- Aplicar la versión Markdown cuando exista cualquier diferencia entre ambas representaciones.

Esta directriz es obligatoria para cualquier herramienta de IA utilizada en el proyecto, incluidos ChatGPT, Codex y otras herramientas equivalentes.
