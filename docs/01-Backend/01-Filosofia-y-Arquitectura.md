# SES Compras

# 01 - Filosofía y Arquitectura

**Estado:** Borrador\
**Versión:** 0.1\
**Última actualización:** Julio 2026

> Documento vivo. Este archivo Markdown es la fuente oficial de la
> documentación. Las versiones DOCX se generan únicamente para
> publicación.

------------------------------------------------------------------------

# 1. Introducción

## 1.1 Propósito

SES Compras es el módulo de gestión de compras del ERP SES. Su objetivo
es incorporar una plataforma moderna para la administración de compras
sin reemplazar el núcleo operativo desarrollado en WinDev y HFSQL.

La arquitectura fue concebida para evolucionar el sistema de forma
incremental, preservando la estabilidad operativa mientras se incorporan
nuevas capacidades mediante tecnologías web modernas.

## 1.2 Objetivos arquitectónicos

-   Preservar la inversión realizada en el sistema legado.
-   Desacoplar la interfaz de usuario del núcleo operativo.
-   Mantener la consistencia entre PostgreSQL y HFSQL.
-   Permitir una evolución progresiva y no disruptiva.

# 2. Filosofía del Proyecto

SES Compras no pretende reemplazar el ERP existente. Su propósito es
extenderlo.

WinDev continúa siendo responsable de las reglas operativas maduras y
HFSQL permanece como la autoridad sobre los datos operacionales. React,
Node.js y PostgreSQL incorporan nuevas capacidades sin alterar el
corazón del sistema.

# 3. Principios Arquitectónicos

  -----------------------------------------------------------------------
  Principio                        Descripción
  -------------------------------- --------------------------------------
  Fuente única de verdad           Cada dominio tiene un sistema
                                   propietario.

  Encapsulación del legado         WinDev queda aislado mediante una API
                                   REST.

  Consistencia eventual            PostgreSQL y HFSQL se coordinan
                                   mediante confirmación e idempotencia.

  Evolución incremental            Las capacidades se incorporan por
                                   etapas.

  Idempotencia                     Las operaciones críticas utilizan
                                   `operacionID`.
  -----------------------------------------------------------------------

# 4. Arquitectura General

``` text
Usuario
   │
   ▼
React (SES UI)
   │
HTTP / JSON
   │
   ▼
Node.js
 ├────────► PostgreSQL
 └────────► WinDev API ─────► HFSQL
```

# 5. Responsabilidad de los Componentes

  Componente   Responsabilidad
  ------------ ------------------------------------------------
  React        Interfaz de usuario
  Node.js      Coordinación del módulo Compras
  PostgreSQL   Persistencia documental
  WinDev       Integración con el ERP legado
  HFSQL        Fuente de verdad para stock, costos y maestros

# 6. Flujo General

Usuario → React → Node.js → PostgreSQL → WinDev → HFSQL → Node.js →
React.

# 7. Decisiones Arquitectónicas

-   PostgreSQL como base documental del módulo Compras.
-   HFSQL como autoridad operacional.
-   Integración mediante REST.
-   Protocolo de idempotencia basado en `operacionID`.

## Convención de fechas, horas y zonas horarias

-   Todas las columnas que representan un instante utilizan PostgreSQL
    `timestamp with time zone` (`timestamptz`).
-   Node.js persiste instantes mediante objetos `Date` o valores ISO en
    UTC. PostgreSQL almacena internamente esos instantes normalizados.
-   Las APIs intercambian fechas y horas en formato ISO 8601.
-   El frontend convierte los instantes a la zona horaria local del
    usuario al presentarlos. Para la presentación puede utilizarse
    `new Date(fecha).toLocaleString("es-AR")` o una utilidad común del
    frontend.
-   No deben aplicarse manualmente desplazamientos de `-3 horas` ni
    almacenarse fechas y horas locales sin información de zona horaria.
-   Los campos que representan sólo una fecha de negocio, como la fecha
    de emisión o la fecha de vencimiento, deben mantenerse diferenciados
    de los campos de auditoría como `created_at` y `updated_at`.
-   `created_at`, `updated_at`, las fechas de operaciones, los logs y la
    idempotencia representan instantes absolutos.
-   La configuración visual de pgAdmin puede mostrar un instante según
    la zona horaria de la sesión sin que eso implique un error de
    persistencia.

Ejemplo:

-   Valor intercambiado por la API: `2026-07-16T03:35:12.000Z`.
-   Presentación para un usuario de Argentina: `16/07/2026 00:35:12`.

Ambos valores representan el mismo instante.

# 8. Riesgos conocidos

-   No existen transacciones distribuidas entre PostgreSQL y HFSQL.
-   La idempotencia debe extenderse al resto de procesos.
-   Los contratos Node--WinDev deben mantenerse sincronizados.

# 9. Evolución prevista

Persistencia → Sincronización → Stock → Idempotencia → Cuenta Corriente
→ OCR → Órdenes de Compra → Pagos → Libro IVA Compras.

------------------------------------------------------------------------

Este documento constituye el documento maestro de arquitectura del
backend. Los documentos específicos (API, modelo de datos, integración
Node--WinDev y especificación funcional) derivan de este.
