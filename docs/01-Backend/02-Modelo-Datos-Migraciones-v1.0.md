# SES Compras

# 02 - Modelo de Datos y Migraciones

**Estado:** En desarrollo

**Versión:** 0.1

**Última actualización:** Julio 2026

> Documento vivo.
>
> Este documento describe el modelo de datos del módulo Compras implementado sobre PostgreSQL, su evolución a través de las migraciones y las decisiones de diseño que guiaron su construcción.
>
> No reemplaza la documentación de Prisma ni de las migraciones SQL; su objetivo es explicar el modelo conceptual y su arquitectura.

---

# Historial

| Versión | Fecha | Cambios |
|----------|---------|------------------------------|
| 0.1 | Julio 2026 | Filosofía del modelo, Arquitectura del dominio y Dominios funcionales. |

---

# Índice

1. Filosofía del modelo
2. Arquitectura del dominio
3. Dominios funcionales
4. Modelo relacional
5. Evolución del modelo
6. Convenciones
7. Integridad y Consistencia
8. Migraciones
9. Riesgos
10. Evolución prevista

---

# 1. Filosofía del modelo

## 1.1 Objetivo

El modelo de datos de SES Compras fue diseñado para soportar el nuevo módulo web de Compras sin modificar la estructura del ERP existente desarrollado en WinDev y HFSQL.

El objetivo no consiste en replicar la totalidad del sistema legado, sino únicamente incorporar aquellas entidades necesarias para administrar el ciclo completo de compras desde una plataforma moderna basada en React, Node.js y PostgreSQL.

Como consecuencia, PostgreSQL se convierte en el repositorio principal de toda la información propia del módulo Compras, mientras que HFSQL continúa siendo la autoridad sobre los datos operacionales del ERP.

---

## 1.2 Separación de responsabilidades

Desde el inicio del proyecto se adoptó un principio fundamental:

> Cada dominio funcional posee un único sistema responsable.

Esta decisión evita duplicar lógica de negocio y reduce significativamente el riesgo de inconsistencias entre ambos motores de datos.

En consecuencia:

| Dominio | Sistema responsable |
|----------|---------------------|
| Compras | PostgreSQL |
| Cuenta Corriente de Proveedores | PostgreSQL |
| Documentación fiscal de compras | PostgreSQL |
| Remitos | PostgreSQL |
| Configuración propia del módulo | PostgreSQL |
| Stock | HFSQL |
| Costos | HFSQL |
| Artículos maestros | HFSQL |
| Proveedores maestros | HFSQL |

Esta separación constituye una de las decisiones arquitectónicas más importantes del proyecto.

---

## 1.3 Modelo complementario

El modelo PostgreSQL no intenta reemplazar HFSQL.

Ambos modelos conviven.

HFSQL continúa siendo el sistema operativo del ERP.

PostgreSQL incorpora nuevas capacidades que históricamente no existían en el sistema original.

Por ese motivo existen entidades completamente nuevas, como:

- remitos de compra;
- detalle normalizado de IVA;
- detalle normalizado de tributos;
- aplicaciones de cuenta corriente;
- sincronizaciones;
- estados de integración.

---

## 1.4 Evolución incremental

El modelo fue construido mediante migraciones sucesivas.

Cada migración resolvió un problema concreto del negocio.

Nunca se diseñó la totalidad del modelo desde el primer día.

La arquitectura evolucionó siguiendo el crecimiento funcional del módulo Compras.

Este enfoque permitió validar cada etapa antes de incorporar nuevas responsabilidades.

---

# 2. Arquitectura del dominio

## 2.1 Organización general

El modelo puede dividirse en varios dominios funcionales claramente diferenciados.

Cada dominio posee responsabilidades específicas y mantiene un bajo acoplamiento respecto de los demás.

Esta organización facilita la evolución del sistema y reduce el impacto de futuras modificaciones.

---

## 2.2 Vista conceptual

```text
                    MAESTROS
            ┌──────────────────────┐
            │                      │
            │ Artículos            │
            │ Proveedores          │
            │ Tipos de IVA         │
            │ Tipos Comprobante    │
            │ Sucursales           │
            └──────────┬───────────┘
                       │
                       ▼
              DOCUMENTOS DE COMPRA
        ┌──────────────────────────────┐
        │                              │
        │ Remitos                      │
        │ Facturas                     │
        │ NC                           │
        │ ND                           │
        └──────────────┬───────────────┘
                       │
                       ▼
             CUENTA CORRIENTE
                       │
                       ▼
              INTEGRACIÓN WINDEV
```

Esta representación resume la organización conceptual del módulo.

No pretende reflejar relaciones físicas entre tablas sino responsabilidades funcionales.

---

## 2.3 Principios de organización

El modelo sigue cuatro principios fundamentales.

### Separación entre maestros y documentos

Los catálogos permanecen desacoplados de los documentos transaccionales.

Esto evita redundancias y facilita futuras sincronizaciones.

---

### Normalización tributaria

El pie impositivo de cada comprobante se almacena en estructuras específicas.

Esto evita depender de columnas fijas para cada alícuota y permite incorporar nuevos tributos sin alterar el modelo principal.

---

### Desacoplamiento del sistema legado

Las entidades propias del módulo Compras no dependen físicamente de HFSQL.

La comunicación entre ambos sistemas se realiza exclusivamente mediante la API WinDev.

---

### Evolución por dominios

Cada nuevo requerimiento incorpora nuevas entidades dentro de un dominio claramente definido, evitando modificar innecesariamente estructuras existentes.

---

# 3. Dominios funcionales

El modelo actual puede agruparse en los siguientes dominios.

---

## 3.1 Maestros

Contiene información utilizada por el resto del sistema.

Incluye principalmente:

- proveedores;
- artículos;
- tipos de comprobante;
- tipos de IVA;
- sucursales;
- depósitos;
- configuraciones auxiliares.

En la mayoría de los casos estos datos provienen de sincronizaciones con WinDev.

---

## 3.2 Documentos

Es el núcleo del módulo Compras.

Aquí se registran los documentos comerciales generados durante el proceso de compra.

Actualmente comprende:

- facturas;
- notas de crédito;
- notas de débito;
- remitos.

Este dominio concentra la mayor parte de la lógica del sistema.

---

## 3.3 Impuestos

Este dominio normaliza la información tributaria.

En lugar de almacenar columnas específicas para cada impuesto, el modelo registra cada concepto impositivo como un detalle independiente.

Esta decisión facilita la incorporación de nuevos tributos sin alterar la estructura principal de los comprobantes.

---

## 3.4 Cuenta Corriente

Agrupa las entidades responsables del seguimiento financiero de cada proveedor.

Su función consiste en registrar:

- débitos;
- créditos;
- aplicaciones;
- movimientos.

Actualmente continúa en evolución.

---

## 3.5 Integración

Este dominio administra la comunicación con WinDev.

Incluye principalmente:

- sincronizaciones;
- estados;
- identificadores utilizados durante la integración;
- información auxiliar requerida para mantener la consistencia entre PostgreSQL y HFSQL.

Su objetivo es desacoplar completamente la lógica documental del mecanismo de integración.

---

## 3.6 Evolución del modelo

La incorporación de nuevos dominios seguirá la misma filosofía utilizada hasta el momento:

- un dominio;
- una responsabilidad;
- un conjunto acotado de entidades;
- mínima dependencia con el resto del sistema.

Este criterio constituye uno de los pilares del diseño del modelo de datos.

---

**Fin de la versión 0.1**

Próxima versión:

- Capítulo 4 — Modelo Relacional.
- Capítulo 5 — Evolución del Modelo.


---

# 4. Modelo Relacional

## 4.1 Principios generales

El modelo relacional del módulo Compras fue diseñado siguiendo un criterio de especialización funcional. Cada entidad representa un concepto del negocio y mantiene responsabilidades claramente definidas.

## 4.2 Clasificación de entidades

### Entidades maestras

- Proveedores
- Artículos
- Tipos de comprobante
- Tipos de IVA
- Sucursales
- Depósitos

### Entidades transaccionales

- Comprobantes
- Detalle de comprobantes
- Remitos
- Detalle de remitos
- Movimientos de cuenta corriente
- Aplicaciones

### Entidades auxiliares

- Sincronizaciones
- Estados de integración
- Parámetros

## 4.3 Organización documental

El modelo abandonó el esquema de una tabla por tipo de comprobante. La especialización se obtiene mediante el tipo documental y no mediante estructuras duplicadas.

## 4.4 Normalización tributaria

IVA y tributos se almacenan en estructuras especializadas para facilitar la incorporación de nuevos conceptos impositivos sin modificar la estructura principal del comprobante.

## 4.5 Modelo documental

```text
Proveedor
    │
    ▼
Comprobante
    ├──► Detalle
    ├──► IVA
    ├──► Tributos
    └──► Cuenta Corriente
```

## 4.6 Modelo de Remitos

Los remitos constituyen un dominio independiente con cabecera, detalle, estado documental, actualización de stock e identificador de integración (operacionID).

## 4.7 Integración con HFSQL

El modelo PostgreSQL evita dependencias físicas con HFSQL y se integra exclusivamente mediante la API WinDev.

---

# 5. Evolución del Modelo

## 5.1 Filosofía evolutiva

El modelo evolucionó acompañando el crecimiento funcional del módulo Compras. Cada migración resolvió una necesidad concreta.

## 5.2 Primera etapa

Infraestructura básica: proveedores, artículos, tipos documentales y comprobantes.

## 5.3 Segunda etapa

Normalización del modelo mediante IVA, tributos y unificación documental.

## 5.4 Tercera etapa

Incorporación de remitos, sincronizaciones, integración de stock y cuenta corriente.

## 5.5 Cuarta etapa

Implementación del protocolo de idempotencia basado en operacionID y confirmación mediante GET.

## 5.6 Línea evolutiva

```text
Modelo inicial
   │
   ▼
Catálogos
   │
   ▼
Comprobantes
   │
   ▼
Normalización tributaria
   │
   ▼
Cuenta Corriente
   │
   ▼
Remitos
   │
   ▼
Integración Node–WinDev
   │
   ▼
Idempotencia
```

## 5.7 Próxima versión

La próxima sesión incorporará Convenciones, Integridad y Migraciones.


---

# 6. Convenciones

## 6.1 Objetivo

El modelo de datos sigue un conjunto de convenciones cuyo objetivo es mantener uniformidad entre las entidades y facilitar su evolución. Estas reglas reducen la complejidad del código, simplifican las migraciones y mejoran la legibilidad del esquema.

## 6.2 Convenciones de nombres

- PostgreSQL utiliza nombres en `snake_case`.
- Las claves primarias se identifican mediante `id`.
- Los identificadores provenientes de WinDev/HFSQL utilizan el prefijo `hfsql_`.
- Las tablas transaccionales poseen tablas de detalle claramente diferenciadas.

## 6.3 Identificadores

Se distinguen dos tipos de identificadores:

- **Locales**, generados por PostgreSQL.
- **Externos**, utilizados para mantener la referencia con HFSQL.

Esta separación permite evolucionar el modelo sin depender de claves físicas del sistema legado.

## 6.4 Precisión numérica

Los importes, cantidades y porcentajes utilizan escalas compatibles con las necesidades contables del módulo, evitando pérdidas de precisión durante cálculos tributarios.

## 6.5 Convenciones de Prisma

Prisma constituye la única capa autorizada para acceder al modelo relacional desde el backend. Las migraciones representan la evolución oficial del esquema y deben mantener compatibilidad con las versiones anteriores.

---

# 7. Integridad y Consistencia

## 7.1 Filosofía

La integridad del modelo no depende exclusivamente de restricciones relacionales. Se obtiene mediante la combinación de restricciones en PostgreSQL, reglas de negocio del backend e integración con WinDev.

## 7.2 Integridad referencial

Las relaciones entre entidades se implementan mediante claves foráneas cuando ambas pertenecen al dominio PostgreSQL.

Las referencias hacia HFSQL se mantienen mediante identificadores externos y son verificadas durante los procesos de sincronización.

## 7.3 Integridad documental

Cada documento debe mantener coherencia entre:

- Cabecera.
- Detalle.
- Información tributaria.
- Estado documental.

La persistencia se realiza mediante transacciones Prisma para asegurar atomicidad dentro del dominio PostgreSQL.

## 7.4 Integridad con WinDev

Las operaciones que afectan stock o costos requieren confirmación del ERP mediante la API WinDev.

Cuando existe incertidumbre, el backend utiliza el protocolo de idempotencia basado en `operacionID` para determinar el resultado definitivo.

## 7.5 Consistencia eventual

Al no existir transacciones distribuidas entre PostgreSQL y HFSQL, la consistencia entre ambos sistemas es eventual y se garantiza mediante:

- confirmación posterior;
- reintentos;
- compensaciones documentales;
- consultas de recuperación.

---

# 8. Migraciones

## 8.1 Filosofía

Cada migración representa un paso evolutivo del modelo. No sólo modifica el esquema físico, sino que documenta una decisión arquitectónica tomada durante el desarrollo del módulo.

## 8.2 Evolución resumida

| Migración | Objetivo | Impacto |
|-----------|----------|---------|
| 001 | Modelo inicial | Base documental |
| Primeras migraciones | Catálogos y entidades maestras | Infraestructura |
| Migraciones intermedias | IVA y tributos | Normalización tributaria |
| Modelo unificado | Comprobantes | Eliminación de duplicaciones |
| Cuenta Corriente | Dominio financiero | Nueva capacidad |
| 026 | Remitos | Flujo documental independiente |
| 027 | operacionID | Idempotencia Node–WinDev |

## 8.3 Principios de migración

- Toda modificación estructural debe realizarse mediante una nueva migración.
- Las migraciones deben ser acumulativas y reproducibles.
- Deben preservar la compatibilidad con datos existentes.
- Las decisiones funcionales relevantes deben reflejarse también en esta documentación.

---

**Próxima versión**

La siguiente sesión completará:

- Capítulo 9 — Riesgos.
- Capítulo 10 — Evolución futura.
- Apéndices y cierre del documento.


---

# 9. Riesgos

## 9.1 Filosofía

Todo modelo de datos representa un equilibrio entre flexibilidad, simplicidad y consistencia. Los riesgos identificados en el modelo actual no corresponden a errores de implementación, sino a decisiones arquitectónicas propias de un sistema que convive con un ERP legado y continúa evolucionando de forma incremental.

## 9.2 Dependencia de sistemas externos

El módulo Compras depende parcialmente de la API WinDev para completar operaciones que afectan al ERP. La disponibilidad de dichas funciones está condicionada a la disponibilidad del servicio de integración.

## 9.3 Consistencia entre PostgreSQL y HFSQL

No existen transacciones distribuidas entre ambos motores. La consistencia se logra mediante:

- protocolo de idempotencia;
- confirmación de operaciones;
- compensaciones documentales;
- consultas posteriores de recuperación.

## 9.4 Sincronización de maestros

Los maestros sincronizados desde HFSQL constituyen una copia operativa. Una interrupción de sincronización puede provocar diferencias temporales entre ambos sistemas.

## 9.5 Evolución del modelo

Persisten dominios en evolución, entre ellos:

- Cuenta Corriente.
- Órdenes de Compra.
- Pagos.
- Libro IVA Compras.

## 9.6 Integridad funcional

Una parte importante de las reglas de negocio continúa ejecutándose dentro del ERP WinDev. PostgreSQL garantiza la integridad estructural; WinDev garantiza parte de la integridad funcional.

## 9.7 Deuda técnica

Se identifican como principales líneas futuras:

- consolidación del modelo de Cuenta Corriente;
- extensión del protocolo de idempotencia;
- conciliación automática entre motores;
- ampliación de la auditoría documental.

---

# 10. Evolución prevista

## 10.1 Filosofía

El modelo fue diseñado para crecer mediante migraciones sucesivas, preservando compatibilidad con las versiones anteriores y evitando reestructuraciones masivas.

## 10.2 Próximos dominios

Se prevé incorporar:

- Órdenes de Compra.
- Recepciones.
- Pagos a Proveedores.
- Libro IVA Compras.
- OCR de comprobantes.
- Conciliación automática Node–WinDev.

## 10.3 Principios de crecimiento

Toda ampliación deberá respetar los principios definidos en este documento:

- una responsabilidad por dominio;
- mínima duplicación de datos;
- integración exclusivamente mediante la API WinDev;
- evolución mediante migraciones controladas.

## 10.4 Estado del documento

Con esta versión queda documentada la arquitectura conceptual del modelo de datos del backend del módulo Compras.

---

# Referencias

Este documento complementa:

- 01-Filosofia-y-Arquitectura.md
- 03-API-REST.md (en desarrollo)
- 04-Compras-Especificacion-Funcional.md (en desarrollo)
- 05-Integracion-Node-WinDev.md

---

**Fin del documento**
