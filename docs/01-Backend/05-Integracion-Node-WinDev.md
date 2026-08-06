# SES Compras

# 05 - Integración Node--WinDev

**Estado:** Implementado y validado\
**Versión:** 1.0\
**Última actualización:** Julio 2026

> Documento vivo. Describe la arquitectura de integración entre el
> backend Node.js y el ERP WinDev.

---

# 1. Objetivo

La integración Node--WinDev permite que el módulo Compras evolucione
utilizando tecnologías modernas sin reemplazar el núcleo operativo del
ERP SES.

Node.js coordina las operaciones del módulo Compras y delega en WinDev
aquellas funciones cuya lógica de negocio pertenece al sistema legado.

---

# 2. Responsabilidades

---

Sistema Responsabilidad

---

React Interfaz de usuario

Node.js Orquestación de procesos, persistencia
PostgreSQL y coordinación

PostgreSQL Información propia del módulo Compras

WinDev Reglas operativas del ERP

HFSQL Fuente de verdad para stock, costos y
maestros

---

---

# 3. Principio fundamental

Cada sistema mantiene la responsabilidad exclusiva sobre su dominio.

Node **no modifica directamente** la información operacional almacenada
en HFSQL.

Toda modificación de stock o costos se realiza exclusivamente mediante
la API WinDev.

---

# 4. Flujo general

```text
React
   │
   ▼
Node.js
   │
   ├── PostgreSQL (persistencia documental)
   │
   └── POST API WinDev
            │
            ▼
         HFSQL
            │
            ▼
     Confirmación
            │
            ▼
Node.js
```

---

# 5. Integración HTTP

La comunicación se realiza mediante JSON sobre HTTP.

Actualmente los procesos principales son:

- Actualización de stock.
- Actualización de costos.
- Sincronización de artículos.
- Sincronización de proveedores.
- Consulta de operaciones.

## Clasificación de artículos combustibles

Todos los endpoints de consulta de artículos devuelven los siguientes campos:

- `rubro_id`
- `sub_rubro_id`
- `es_combustible`

Los endpoints construyen su respuesta mediante la estructura común `stArticulo`, que mantiene un contrato JSON unificado para las distintas modalidades de consulta.

Ejemplo:

```json
{
  "rubro_id": 2,
  "sub_rubro_id": 39,
  "es_combustible": false
}
```

`es_combustible` es la fuente oficial para determinar el tratamiento tributario del artículo.

Frontend y backend deben utilizar este campo para decidir el comportamiento de ICL, IDC e Impuesto Interno.

No debe inferirse la clasificación a partir de los importes de ICL o IDC.

Para artículos combustibles, ICL e IDC conforman el Impuesto Interno y se conservan como su apertura informativa. Para artículos no combustibles, ICL e IDC permanecen en cero y el Impuesto Interno se informa directamente. El total del comprobante incorpora únicamente el Impuesto Interno y no vuelve a adicionar ICL ni IDC.

---

# 6. Protocolo de idempotencia

Las operaciones críticas generan un **operacionID** (UUID).

Ese identificador acompaña toda la operación desde Node hasta WinDev.

WinDev registra el estado en **apiOperacionesProcesadas**.

Estados implementados:

- RECIBIDA
- PROCESANDO
- APLICADA
- ERROR

---

# 7. Confirmación de operaciones

El flujo normal del protocolo, ilustrado aquí con la actualización histórica
de stock, es:

```text
POST actualizar-stock
        │
        ▼
¿Respuesta confiable?

   Sí ─────────► finalizar

   No
    │
    ▼
GET /operaciones/{operacionID}
    │
    ▼
APLICADA / ERROR / PROCESANDO / NO_ENCONTRADA
```

Node nunca supone éxito únicamente porque el POST fue enviado.

---

# 8. Transacciones

## PostgreSQL

Las operaciones documentales utilizan transacciones Prisma
(`$transaction`).

## WinDev

Las operaciones sobre HFSQL utilizan:

- HTransactionStart()
- HTransactionEnd()
- HTransactionCancel()

Cada actualización de stock constituye una única unidad atómica.

---

# 9. Compensación en el antecedente de Remitos

No existen transacciones distribuidas entre PostgreSQL y HFSQL.

En el flujo histórico de Remitos, cuando Node no puede confirmar la actualización de stock:

1.  consulta el estado mediante GET;
2.  si WinDev informa ERROR o no puede confirmarse la operación, ejecuta
    una compensación local propia de ese flujo;
3.  el remito se elimina y la operación finaliza con error.

---

# 10. Errores funcionales

WinDev es responsable de las validaciones de negocio.

Ejemplo:

```text
No existe el artículo 999999999 informado en la posición 1
```

Node preserva este mensaje y lo devuelve al frontend junto con el
`operacionID`.

---

# 11. Casos históricos validados

- Operación exitosa.
- API WinDev no configurada.
- Error de conexión.
- Timeout.
- Artículo inexistente.
- Idempotencia por reintento.
- Rollback transaccional en WinDev.
- Compensación en PostgreSQL para Remitos.

---

# 12. Evolución del protocolo

La primera implementación del protocolo de idempotencia se aplicó al
flujo de Remitos. Facturas, Notas de Crédito y Notas de Débito se
registran actualmente mediante el flujo unificado de comprobantes de
compra descrito más adelante. Este flujo posee su propia regla
transaccional y una reconciliación operativa de pendientes; no debe
considerarse equivalente al flujo histórico de Remitos.

La eventual aplicación del mismo mecanismo de reconciliación a otros
procesos críticos queda fuera del alcance actual.

# 13. Flujo específico de Remitos

## Objetivo

Registrar un Remito de Compra manteniendo consistencia entre PostgreSQL y WinDev.

## Flujo

React

↓

POST /api/remitos/registrar

↓

Persistencia PostgreSQL

↓

compras_remitos

↓

compras_remitos_detalle

↓

Generación de operacionID

↓

POST /stock/actualizar

↓

WinDev

↓

StockMov

↓

StockMov_Detalle

↓

apiOperacionesProcesadas

↓

Confirmación

↓

Respuesta al Frontend

---

## Validaciones

Antes de invocar WinDev:

- duplicado de remito
- artículos válidos
- cantidades válidas
- depósito
- sucursal

Si alguna falla, no se realiza ninguna llamada a WinDev.

---

## Idempotencia

Cada actualización de stock genera un UUID único.

La operación queda registrada tanto en PostgreSQL como en WinDev.

En caso de pérdida de respuesta HTTP puede consultarse posteriormente el estado mediante el endpoint de recuperación.

---

## Estado

Implementado y validado funcionalmente.

---

# 14. Consistencia transaccional entre PostgreSQL y WinDev

## Objetivo

El objetivo de la integración es garantizar que el estado del comprobante en PostgreSQL y el estado de la operación en WinDev permanezcan siempre consistentes.

Durante el diseño de la integración se identificaron tres escenarios claramente diferenciados:

1. La operación fue aplicada correctamente.
2. La operación fue rechazada por WinDev.
3. No fue posible conocer el resultado de la operación.

Cada escenario requiere un tratamiento diferente.

## Filosofía de diseño

La idempotencia **no fue incorporada para resolver errores funcionales**.

Su único objetivo es resolver la incertidumbre producida por una pérdida de comunicación entre Node y WinDev.

Cuando WinDev responde, el resultado siempre debe considerarse definitivo.

- **APLICADA** → la operación es válida.
- **ERROR** → la operación es inválida.
- **Sin respuesta** → estado incierto.

## Escenario 1 – Operación aplicada

```text
BEGIN TRANSACTION
        │
Persistir comprobante
        │
Invocar WinDev
        │
WinDev → APLICADA
        │
Actualizar operación
        │
COMMIT
```

Resultado:

- comprobante persistido;
- stock actualizado (si corresponde);
- costos actualizados;
- operación finalizada correctamente.

## Escenario 2 – Error funcional

```text
BEGIN TRANSACTION
        │
Persistir comprobante
        │
Invocar WinDev
        │
WinDev → ERROR
        │
ROLLBACK
```

Resultado:

- el comprobante no queda almacenado;
- el operador corrige el problema y vuelve a intentar.

En este escenario **no interviene la idempotencia**.

## Escenario 3 – Resultado incierto

```text
BEGIN TRANSACTION
        │
Persistir comprobante
        │
Invocar WinDev
        │
Sin respuesta
        │
COMMIT
```

El comprobante queda persistido junto con su `operacionID` y marcado como pendiente de reconciliación.

Cuando el operador intenta iniciar un nuevo comprobante, Node consulta el estado
mediante el endpoint de reconciliación.

- Si WinDev informa **APLICADA**, el comprobante se confirma.
- Si WinDev informa **ERROR**, el comprobante se elimina.
- Si WinDev informa **NO_ENCONTRADA** al agotar los intentos, el comprobante se elimina.
- Si continúa sin conocerse el resultado, permanece pendiente hasta una nueva verificación.

## Regla arquitectónica

| Respuesta de WinDev | Acción en PostgreSQL |
|---------------------|----------------------|
| APLICADA | COMMIT |
| ERROR | ROLLBACK |
| Sin respuesta | COMMIT + Pendiente de reconciliación |

Esta decisión arquitectónica evita comprobantes huérfanos y reserva la idempotencia exclusivamente para los casos donde realmente existe incertidumbre sobre el resultado de la operación.

---

# 15. Comprobantes de compra

## Integración idempotente de comprobantes de compra

### Objetivo

Facturas, Notas de Crédito y Notas de Débito utilizan una única operación
WinDev para actualizar:

- los precios de costo seleccionados por artículo;
- el stock, cuando el comprobante así lo requiere.

El endpoint vigente es:

```text
POST /apicompras/comprobantes/actualizar-articulos-stock
```

Node genera un único `operacionID` UUID. El mismo identificador se persiste
en PostgreSQL, se envía en el POST y se reutiliza en todas las consultas de
confirmación a WinDev.

### Condición para integrar

Existe integración con WinDev solamente cuando se cumplen ambas condiciones:

1. hay artículos reales; los conceptos manuales, identificados con
   `hfsql_articulos_id = -99`, quedan excluidos;
2. `actualizar_stock` es verdadero o al menos un artículo tiene
   `actualizar_costo = true`.

Cuando no se requiere integración, `operacion_id` queda en `NULL`,
`estado_integracion` se guarda como `NO_REQUIERE` y el comprobante se confirma
sin invocar WinDev.

### Contrato funcional y payload

`actualizarStock` es una decisión global del comprobante. `actualizarCosto`
es una decisión individual de cada artículo. El payload conserva todos los
artículos reales y cada uno informa expresamente si debe actualizar su costo.

Los campos principales enviados por el controlador son:

| Nivel | Campos relevantes |
|---|---|
| Operación | `operacionID`, `tipoOperacion`, `tipoEntidad`, `entidadID` |
| Comprobante | `comprobanteTipoId`, `depositoId`, `factor`, `puntoVenta`, `nroComprobante`, `actualizarStock` |
| Auditoría | `usuarioId`, `usuarioNombre`, `observaciones` |
| Artículo | `articulosID`, `descripcion`, `cantidad`, `precioCosto`, `actualizarCosto`, `proveedoresID` |
| Impuestos | `impTransfComb`, `impDioxidoCarbono`, `impInternoMonto`, `ivaTiposID` |

Si no se actualiza stock, `depositoId` se envía como `0`. No existen dos POST
separados y el flujo no encadena los endpoints antiguos de costo y stock.

### Persistencia en PostgreSQL

`compras_comprobantes` contiene:

- `operacion_id UUID NULL UNIQUE`, incorporado por la migración 028;
- `estado_integracion VARCHAR(20) NOT NULL DEFAULT 'NO_REQUIERE'`, incorporado
  por la migración 029.

Los estados persistibles son:

| Estado | Significado |
|---|---|
| `NO_REQUIERE` | El comprobante no necesitó integración WinDev. |
| `PENDIENTE` | Node no pudo obtener un resultado confiable. |
| `APLICADA` | WinDev confirmó la aplicación. |

`ERROR` no se persiste: durante el alta provoca rollback completo.

### Alta transaccional

`registrarComprobante()` ejecuta una transacción interactiva Prisma con un
timeout acotado de 40 segundos. Dentro de la misma unidad se realizan:

- cabecera;
- detalle;
- detalle de IVA;
- tributos;
- asociaciones con remitos;
- movimiento de cuenta corriente, cuando corresponde;
- persistencia de `operacion_id` y estado inicial;
- llamada a WinDev y consultas limitadas de confirmación;
- decisión final de commit o rollback.

| Resultado | PostgreSQL | Estado persistido | HTTP |
|---|---|---|---:|
| Sin integración | COMMIT | `NO_REQUIERE` | 201 |
| `APLICADA` | COMMIT | `APLICADA` | 201 |
| `ERROR` definitivo | ROLLBACK completo | Ninguno | 502 |
| `INCIERTA` | COMMIT | `PENDIENTE` | 202 |

Ante `ERROR`, el controlador lanza una excepción controlada dentro de la
transacción. Prisma revierte cabecera y dependencias; no existe una eliminación
compensatoria manual posterior al POST. Ante `INCIERTA`, la transacción confirma
el comprobante, conserva el mismo `operacion_id` y no repite el POST.

Las respuestas exitosas exponen el comprobante en `comprobante`, no en el
contrato histórico `data.data`.

### Cliente WinDev

`windevClient.js` implementa el protocolo siguiente:

- POST con timeout de 8 segundos;
- lectura segura del cuerpo y validación JSON;
- aceptación de `APLICADA` o `ERROR` definitivos cuando la respuesta es
  confiable;
- ante respuesta perdida, timeout o resultado no concluyente, consulta
  `GET /apicompras/operaciones/{operacionID}`;
- GET con timeout de 4 segundos;
- hasta cinco consultas, con 500 ms entre intentos;
- reutilización estricta del mismo `operacionID`;
- resultados normalizados como `APLICADA`, `ERROR` o `INCIERTA` para el alta.

Después de una respuesta perdida o un timeout, el cliente nunca repite el POST.
La idempotencia se utiliza para consultar el resultado, no para ocultar errores
funcionales.

### Fecha de actualización de stock

Durante el alta, `fecha_actualizacion_stock` se completa únicamente cuando
`actualizarStock` es verdadero y WinDev confirma `APLICADA`.

Durante la reconciliación, el cliente devuelve la confirmación con esta forma:

```text
{ estado: "APLICADA", resultado: <respuesta WinDev> }
```

El controlador considera que hubo movimiento de stock si
`stockMovId > 0` o `itemsStockProcesados > 0` dentro de `resultado`. Sólo en ese
caso asigna la fecha actual. Si la operación aplicada actualizó únicamente
costos, ambos indicadores son cero y `fecha_actualizacion_stock` permanece
`NULL`.

### Reconciliación de pendientes

La reconciliación se ejecuta exclusivamente cuando el operador pulsa
`+ Nuevo comprobante` y vuelve a ejecutarse si pulsa `Volver a verificar`.
No se inicia en cada render ni existe polling automático.

El endpoint Node es:

```text
GET /api/comprobantes/reconciliar-pendientes
```

Busca comprobantes que cumplan:

```text
estado_integracion = 'PENDIENTE'
operacion_id IS NOT NULL
```

Para cada registro consulta exclusivamente
`GET /apicompras/operaciones/{operacionID}`. No reenvía el POST, no genera otro
UUID y no utiliza jobs, cron, colas ni procesos en segundo plano.

| Resultado de la consulta | Acción |
|---|---|
| `APLICADA` | Conserva el comprobante, marca `APLICADA`, completa la fecha de stock si los indicadores lo demuestran y permite continuar. |
| `ERROR` | Elimina comprobante y dependencias dentro de una transacción y permite continuar. |
| `NO_ENCONTRADA` | Después de agotar las consultas limitadas, trata la operación como no aplicada, elimina transaccionalmente y permite continuar. |
| `RECIBIDA` o `PROCESANDO` sin resolución | Conserva `PENDIENTE` y bloquea el ingreso. |
| Timeout, conexión fallida, HTTP inválido, cuerpo vacío, JSON inválido o respuesta inesperada | Conserva `PENDIENTE`, bloquea e informa al operador. |

La consulta específica de reconciliación distingue `NO_ENCONTRADA` de la
incertidumbre de infraestructura sin alterar el comportamiento del alta.

### Eliminación transaccional durante la reconciliación

La eliminación sólo ocurre ante `ERROR` o `NO_ENCONTRADA` confirmados:

1. `compras_cc_movimientos` se elimina explícitamente porque su relación no usa
   cascada;
2. se elimina la cabecera de `compras_comprobantes` todavía marcada como
   `PENDIENTE`;
3. PostgreSQL elimina por `ON DELETE CASCADE` las filas de
   `compras_comprobantes_detalle`, `compras_comprobantes_iva_detalle`,
   `compras_comprobantes_tributos_detalle` y `compras_remitos_asociados`.

Todas estas acciones forman una única transacción Prisma. No se elimina nada
ante una respuesta incierta.

### Bloqueo operativo

`PENDIENTE` significa exclusivamente que Node no pudo obtener una respuesta
confiable de WinDev; no representa un rechazo funcional conocido. Mientras
persista un pendiente, no se permite iniciar otro comprobante. El operador no
puede ignorarlo y no dispone de acciones para reenviar, forzar o continuar de
todos modos.

La respuesta del endpoint contiene ID local, proveedor, tipo, punto de venta y
número, fecha, total y `operacionID`. La presentación vigente del diálogo tiene
el título `Operación pendiente` y muestra ID local, proveedor, tipo, punto de
venta y número, total y el UUID completo. Ofrece solamente:

- `Cerrar`;
- `Volver a verificar`.

Su propósito es explicar el bloqueo y solicitar que el operador se comunique
con el responsable del sistema cuando la infraestructura no responde de forma
confiable.

### Justificación

El bloqueo prioriza la consistencia entre Compras y Gestión Ventas sobre la
continuidad operativa. Si WinDev no está disponible, una nueva integración
tampoco puede completarse correctamente. La intervención humana aparece sólo
cuando las consultas limitadas no pueden resolver automáticamente un problema
de infraestructura.

### Pruebas ejecutadas

#### Automatizadas

`backend/tests/windevClient.test.mjs` ejecuta actualmente 15 escenarios:

- siete escenarios del alta: aplicación directa, compatibilidad de respuesta,
  confirmación por GET, error definitivo, incertidumbre, recuperación posterior
  a respuesta inválida y error confirmado por GET;
- ocho escenarios GET de reconciliación: cuatro combinaciones de `APLICADA`
  con y sin indicadores de stock, `ERROR`, `NO_ENCONTRADA`, `PROCESANDO` sin
  resolución y timeout.

Las pruebas verifican además que la reconciliación utiliza exclusivamente GET.

#### Manuales validadas

En el entorno integrado se validaron:

- Factura A simple;
- Factura A con múltiples artículos;
- artículos repetidos;
- artículos combustibles;
- artículos no combustibles;
- comprobantes mixtos;
- actualización de stock;
- actualización de precio de costo;
- persistencia en PostgreSQL;
- persistencia en WinDev;
- registro en `apiOperacionesProcesadas`;
- idempotencia;
- alta sin integración;
- actualización sólo de costo;
- actualización sólo de stock;
- actualización conjunta de costo y stock;
- `ERROR` con rollback de PostgreSQL;
- `APLICADA` con persistencia correcta;
- generación de `PENDIENTE` con IIS detenido y bloqueo de una nueva alta;
- restauración de IIS y acción `Volver a verificar`;
- resolución `NO_ENCONTRADA`, eliminación del comprobante y sus dependencias;
- apertura posterior de `Nuevo comprobante`;
- consulta SQL con cero registros para la cabecera eliminada y sus tablas
  dependientes.

La API WinDev del entorno de prueba y despliegue está publicada en IIS mediante
HTTP.sys, `DefaultAppPool` y el proceso `w3wp.exe`.

### Flujo resumido

Alta:

```text
Validar
  -> abrir transacción PostgreSQL
  -> persistir
  -> POST WinDev
     -> APLICADA: COMMIT
     -> ERROR: ROLLBACK
     -> INCIERTA: COMMIT PENDIENTE
```

Reconciliación:

```text
Nuevo comprobante
  -> buscar PENDIENTES
  -> GET WinDev
     -> APLICADA: actualizar
     -> ERROR / NO_ENCONTRADA: eliminar
     -> sin respuesta confiable: conservar y bloquear
```

### Límites actuales

Quedan fuera del alcance implementado:

- reconciliación de Remitos bajo este mismo mecanismo;
- monitoreo centralizado de disponibilidad;
- panel administrativo de operaciones;
- reenvíos manuales;
- jobs, colas o procesos de reconciliación en segundo plano.

Estos límites describen capacidades no implementadas y no implican por sí solos
un compromiso de roadmap inmediato.
