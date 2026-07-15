# SES Compras

# 05 - Integración Node--WinDev

**Estado:** Borrador\
**Versión:** 0.1\
**Última actualización:** Julio 2026

> Documento vivo. Describe la arquitectura de integración entre el
> backend Node.js y el ERP WinDev.

------------------------------------------------------------------------

# 1. Objetivo

La integración Node--WinDev permite que el módulo Compras evolucione
utilizando tecnologías modernas sin reemplazar el núcleo operativo del
ERP SES.

Node.js coordina las operaciones del módulo Compras y delega en WinDev
aquellas funciones cuya lógica de negocio pertenece al sistema legado.

------------------------------------------------------------------------

# 2. Responsabilidades

  -----------------------------------------------------------------------
  Sistema                    Responsabilidad
  -------------------------- --------------------------------------------
  React                      Interfaz de usuario

  Node.js                    Orquestación de procesos, persistencia
                             PostgreSQL y coordinación

  PostgreSQL                 Información propia del módulo Compras

  WinDev                     Reglas operativas del ERP

  HFSQL                      Fuente de verdad para stock, costos y
                             maestros
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 3. Principio fundamental

Cada sistema mantiene la responsabilidad exclusiva sobre su dominio.

Node **no modifica directamente** la información operacional almacenada
en HFSQL.

Toda modificación de stock o costos se realiza exclusivamente mediante
la API WinDev.

------------------------------------------------------------------------

# 4. Flujo general

``` text
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

------------------------------------------------------------------------

# 5. Integración HTTP

La comunicación se realiza mediante JSON sobre HTTP.

Actualmente los procesos principales son:

-   Actualización de stock.
-   Actualización de costos.
-   Sincronización de artículos.
-   Sincronización de proveedores.
-   Consulta de operaciones.

------------------------------------------------------------------------

# 6. Protocolo de idempotencia

Las operaciones críticas generan un **operacionID** (UUID).

Ese identificador acompaña toda la operación desde Node hasta WinDev.

WinDev registra el estado en **apiOperacionesProcesadas**.

Estados implementados:

-   RECIBIDA
-   PROCESANDO
-   APLICADA
-   ERROR

------------------------------------------------------------------------

# 7. Confirmación de operaciones

El flujo normal es:

``` text
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

------------------------------------------------------------------------

# 8. Transacciones

## PostgreSQL

Las operaciones documentales utilizan transacciones Prisma
(`$transaction`).

## WinDev

Las operaciones sobre HFSQL utilizan:

-   HTransactionStart()
-   HTransactionEnd()
-   HTransactionCancel()

Cada actualización de stock constituye una única unidad atómica.

------------------------------------------------------------------------

# 9. Compensación

No existen transacciones distribuidas entre PostgreSQL y HFSQL.

Cuando Node no puede confirmar la actualización de stock:

1.  consulta el estado mediante GET;
2.  si WinDev informa ERROR o no puede confirmarse la operación, ejecuta
    una compensación local;
3.  el remito se elimina y la operación finaliza con error.

------------------------------------------------------------------------

# 10. Errores funcionales

WinDev es responsable de las validaciones de negocio.

Ejemplo:

``` text
No existe el artículo 999999999 informado en la posición 1
```

Node preserva este mensaje y lo devuelve al frontend junto con el
`operacionID`.

------------------------------------------------------------------------

# 11. Casos validados

-   Operación exitosa.
-   API WinDev no configurada.
-   Error de conexión.
-   Timeout.
-   Artículo inexistente.
-   Idempotencia por reintento.
-   Rollback transaccional en WinDev.
-   Compensación en PostgreSQL.

------------------------------------------------------------------------

# 12. Evolución prevista

La primera implementación del protocolo de idempotencia se encuentra
aplicada al flujo de Remitos.

Las próximas etapas contemplan:

-   Extensión del protocolo a Facturas.
-   Extensión a Notas de Crédito y Débito.
-   Aplicación al resto de operaciones críticas.
-   Conciliación automática entre PostgreSQL y HFSQL.
