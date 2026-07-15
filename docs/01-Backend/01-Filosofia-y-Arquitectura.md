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
