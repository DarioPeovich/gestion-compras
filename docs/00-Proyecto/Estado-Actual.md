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
- Integración Node ↔ WinDev para comprobantes, implementada y validada
- Protocolo idempotente de comprobantes finalizado
- Subsistema de verificación de disponibilidad mediante `GET /api/status` y `GET /api/status/windev`

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
- Búsqueda por Código SES implementada de extremo a extremo mediante WinDev, Node y frontend
- Carga de múltiples líneas correspondientes al mismo artículo, sin consolidación automática y con participación normal en cantidades, stock, impuestos y total
- Selección opcional de una única línea por artículo para `Actualizar precio costo`, con cambio atómico entre líneas repetidas
- Protección contra la actualización de costo desde líneas con precio no positivo o con precios simbólicos que no superen el umbral funcional definido respecto del mayor precio positivo del artículo
- Validación final defensiva de la selección de costo antes de enviar el comprobante al backend, independiente del cálculo y la validación de `Total Factura`
- Control obligatorio de Total Factura para Facturas y Notas de Crédito
- Comparación de `totalManual` contra `sumaCalculada` con tolerancia absoluta de 0,05
- Cancelación inteligente basada en datos significativos ingresados

### Artículos repetidos

Estado: ✅ Implementado y validado

- Se permite ingresar múltiples líneas del mismo artículo sin consolidarlas.
- Todas las líneas participan en cantidades, stock, impuestos y total del comprobante.
- Por cada artículo puede haber cero o una línea marcada para actualizar el precio de costo.
- Si se elimina la línea marcada, puede seleccionarse otra línea sin restricciones derivadas de la selección anterior.
- El precio de costo se obtiene únicamente de la línea marcada.

### Impuestos Internos

Estado: ✅ Implementado y validado

El contrato de artículos incorpora `es_combustible` como única fuente válida para determinar el tratamiento tributario. La clasificación no se infiere mediante los importes de ICL o IDC.

- En artículos combustibles, ICL e IDC son editables, el Impuesto Interno se calcula como `ICL + IDC` y permanece en modo de sólo lectura.
- En artículos no combustibles, ICL e IDC permanecen en cero y el Impuesto Interno es editable.
- El total del comprobante incorpora únicamente el Impuesto Interno.
- ICL e IDC constituyen exclusivamente la apertura informativa exigida por ARCA y no se adicionan nuevamente al total.
- La misma regla se aplica en React y Node.

### Validación funcional del bloque

Se validaron satisfactoriamente:

- Factura A simple;
- Factura A con múltiples artículos;
- artículos repetidos;
- combustibles;
- no combustibles;
- comprobantes mixtos;
- actualización de stock;
- actualización de precio de costo;
- persistencia PostgreSQL;
- persistencia WinDev;
- `apiOperacionesProcesadas`;
- idempotencia.

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

La integración de comprobantes de compra está **finalizada, implementada y validada**. El flujo unifica la actualización selectiva de costos y la actualización global de stock mediante un único endpoint WinDev y un solo `operacionID` UUID compartido con PostgreSQL.

Se encuentran implementados:

- endpoint único `POST /apicompras/comprobantes/actualizar-articulos-stock`;
- protocolo idempotente sin repetición automática del POST;
- transacción PostgreSQL con rollback completo ante `ERROR` definitivo;
- estados persistibles `NO_REQUIERE`, `PENDIENTE` y `APLICADA`;
- persistencia `PENDIENTE` exclusivamente cuando el resultado es incierto;
- reconciliación al pulsar `+ Nuevo comprobante` y `Volver a verificar`;
- consultas de reconciliación exclusivamente mediante GET y con el mismo UUID;
- eliminación transaccional ante `ERROR` o `NO_ENCONTRADA` confirmados;
- bloqueo preventivo de nuevas altas mientras persista un pendiente;
- diálogo operativo con las acciones `Cerrar` y `Volver a verificar`;
- pruebas automatizadas y pruebas manuales integrales validadas.

El protocolo transaccional y de reconciliación descrito corresponde a comprobantes. Remitos conserva su flujo específico y no debe considerarse implementado con exactamente el mismo mecanismo.

### Disponibilidad de servicios

El subsistema de verificación de disponibilidad se encuentra completamente implementado y forma parte de la arquitectura operativa mediante dos endpoints exclusivamente de consulta:

```text
GET /api/status
GET /api/status/windev
```

`GET /api/status` verifica la disponibilidad de SES Compras API (Node) y la conectividad con PostgreSQL. `GET /api/status/windev` consulta Gestión Ventas API y permite diferenciar si el servicio responde y si HFSQL se encuentra disponible. Ninguno de estos endpoints ejecuta lógica de negocio.

El frontend ejecuta ambas verificaciones antes de iniciar la reconciliación. El flujo vigente de Nuevo Comprobante es:

```text
Usuario
    ↓
Nuevo Comprobante
    ↓
GET /api/status
    ↓
GET /api/status/windev
    ↓
si ambos servicios están disponibles
    ↓
GET /api/comprobantes/reconciliar-pendientes
    ↓
apertura del formulario
```

`GET /api/status` verifica SES Compras API y PostgreSQL. `GET /api/status/windev` verifica Gestión Ventas API y HFSQL. La reconciliación sólo comienza cuando ambos servicios se encuentran disponibles.

Si alguna dependencia no está disponible o su estado no puede verificarse, el flujo se interrumpe antes de ejecutar la reconciliación y el operador recibe un mensaje específico. De esta forma se distinguen SES Compras API, PostgreSQL, Gestión Ventas API y HFSQL, y una caída de Node ya no se presenta como un problema de Gestión Ventas.

La reconciliación de operaciones pendientes continúa siendo un mecanismo independiente y no fue reemplazada por los endpoints de estado.
