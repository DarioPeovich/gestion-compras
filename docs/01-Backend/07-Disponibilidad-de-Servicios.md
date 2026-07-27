# SES Compras

# 07 - Disponibilidad de Servicios

**Estado actual:** 🟢 Etapa 1 implementada y validada.\
**Etapa siguiente:** 🟡 Etapa 2 pendiente.\
**Versión:** 0.1\
**Última actualización:** Julio 2026

> Documento de arquitectura para la verificación transversal de disponibilidad
> de SES Compras y sus integraciones. La Etapa 1 se encuentra implementada; las
> rutas de etapas posteriores no se consideran disponibles hasta completar su
> implementación y validación.

---

# 1. Propósito

Durante una prueba, el frontend intentó reconciliar comprobantes pendientes
mientras la API Node de SES Compras estaba detenida. El error de conexión terminó
mostrando un mensaje relacionado con Gestión Ventas, aunque la API WinDev estaba
disponible.

El problema no pertenece al protocolo de reconciliación. Se origina en la falta
de una verificación previa y transversal que identifique qué capa no está
disponible antes de iniciar un proceso operativo.

Este diseño busca:

- cortar tempranamente el flujo cuando SES Compras API no está disponible;
- informar al operador qué servicio impide continuar;
- evitar atribuir a Gestión Ventas un fallo ocurrido antes de contactar a Node;
- distinguir la disponibilidad de Node, PostgreSQL e integraciones externas;
- permitir que cada módulo compruebe sólo las dependencias que necesita.

La solución es transversal y reutilizable. No queda limitada al flujo de Nuevo
Comprobante.

---

# 2. Arquitectura de capas

La plataforma base sigue este recorrido:

```text
Frontend React
    |
    v
SES Compras API - Node/Express
    |
    v
PostgreSQL
```

Los procesos que necesitan capacidades operativas de Gestión Ventas agregan una
integración independiente:

```text
SES Compras API - Node/Express
    |
    v
Gestión Ventas API - WinDev/WebDev
    |
    v
HFSQL
```

Node, PostgreSQL y WinDev son capas diferentes y cada una puede fallar de manera
independiente. Por ello:

- no debe existir un único estado global que confunda la plataforma local con
  sus integraciones externas;
- un Node activo no garantiza que PostgreSQL esté accesible;
- una plataforma SES Compras activa no garantiza que WinDev esté disponible;
- la indisponibilidad de WinDev no debe bloquear módulos que no lo necesitan.

Las futuras integraciones deben incorporarse como dependencias separadas, sin
cambiar la semántica del estado general de SES Compras.

---

# 3. Endpoint general de SES Compras

El endpoint general se encuentra implementado:

```http
GET /api/status
```

## Responsabilidad

El endpoint debe:

- confirmar que la API Node está activa;
- ejecutar una comprobación liviana de acceso a PostgreSQL;
- responder rápidamente y sin modificar datos;
- no ejecutar lógica de negocio;
- no comprobar WinDev ni otras integraciones externas.

Actualmente confirma la disponibilidad de SES Compras API y comprueba la
conectividad con PostgreSQL mediante la instancia Prisma existente. Su respuesta
representa únicamente el estado de SES Compras; no realiza ninguna verificación
de Gestión Ventas. El frontend lo utiliza como comprobación previa antes de
iniciar procesos que requieren el backend.

Respuesta exitosa de referencia:

```json
{
  "ok": true,
  "servicio": "SES Compras API",
  "estado": "ACTIVO",
  "database": {
    "estado": "ACTIVA"
  }
}
```

Si Node está activo pero PostgreSQL no está disponible, debe responder con un
HTTP no exitoso y un JSON controlado:

```json
{
  "ok": false,
  "servicio": "SES Compras API",
  "estado": "NO_DISPONIBLE",
  "database": {
    "estado": "NO_DISPONIBLE"
  }
}
```

La estructura definitiva podrá ajustarse durante la implementación, pero debe
conservar esta semántica: `ACTIVO` significa que Node responde y PostgreSQL está
accesible. Si Node está detenido no existe respuesta JSON; el frontend detecta
un error de conexión.

El cuerpo nunca debe exponer cadenas de conexión, servidores internos, usuarios,
claves, trazas ni detalles completos de excepciones.

## Implementación actual

El flujo vigente para Nuevo Comprobante es:

```text
Usuario
  -> Acción (+ Nuevo comprobante)
  -> GET /api/status
  -> Si SES Compras está disponible
  -> GET /api/comprobantes/reconciliar-pendientes
  -> Si no existen pendientes
  -> Abrir formulario
```

Si `/api/status` informa indisponibilidad, el flujo se interrumpe antes de
cualquier operación funcional y el operador recibe un mensaje específico sobre
la disponibilidad del servicio.

---

# 4. Endpoint de Gestión Ventas

## Convención REST para servicios externos

La convención futura para endpoints de disponibilidad es:

```text
GET /api/status
GET /api/status/{servicio}
```

`/api/status` representa exclusivamente la plataforma SES Compras. Cada
dependencia externa se identifica mediante un segmento estable en
`/api/status/{servicio}`, sin incorporarla al resultado general. Para Gestión
Ventas, el diseño previsto utiliza:

```http
GET /api/status/windev
```

Esta convención permite agregar futuras integraciones sin romper el contrato de
estado general ni crear rutas con patrones diferentes para la misma
responsabilidad.

Se diseña como segunda etapa un endpoint separado:

```http
GET /api/status/windev
```

## Responsabilidad

Debe:

- comprobar exclusivamente la disponibilidad de Gestión Ventas API;
- ejecutarse a través de Node;
- consultar un endpoint de estado propio de WinDev;
- no modificar datos;
- no generar `operacionID`;
- no ejecutar reconciliación;
- no consultar una operación de negocio ficticia.

Respuesta exitosa de referencia:

```json
{
  "ok": true,
  "servicio": "Gestión Ventas API",
  "estado": "ACTIVO"
}
```

Respuesta no disponible de referencia:

```json
{
  "ok": false,
  "servicio": "Gestión Ventas API",
  "estado": "NO_DISPONIBLE"
}
```

El estado de WinDev es independiente del estado general de SES Compras. El
endpoint interno de estado de WinDev es un requisito posterior y no se diseña en
detalle en esta etapa.

---

# 5. Separación de estados

No se debe condensar toda la plataforma en una respuesta global como:

```json
{
  "ok": false,
  "node": "ACTIVO",
  "database": "ACTIVA",
  "windev": "NO_DISPONIBLE"
}
```

Ese `ok: false` sería ambiguo para un módulo que no utiliza WinDev. Por ejemplo:

- Proveedores puede operar sobre Node y PostgreSQL aunque WinDev esté detenido;
- Cuenta Corriente puede no requerir WinDev;
- Nuevo Comprobante sólo requiere WinDev si confirma una actualización de costo
  o stock;
- una operación pendiente sí requiere consultar WinDev para reconciliarse.

La decisión arquitectónica es:

- `/api/status` verifica la plataforma SES Compras;
- `/api/status/windev` verificará la integración con Gestión Ventas cuando se
  implemente la Etapa 2;
- cada módulo consulta únicamente las dependencias necesarias para su acción.

---

# 6. Uso en el frontend

La verificación debe ejecutarse ante una acción concreta del usuario, no en cada
render ni mediante intervalos.

## Flujo general

```text
Usuario inicia un módulo
    |
    v
GET /api/status
    |
    +-- Node y PostgreSQL disponibles --> continuar
    |
    +-- No disponibles -----------------> detener flujo
                                          mostrar SES Compras no disponible
```

## Nuevo Comprobante

```text
Click en Nuevo comprobante
    |
    v
GET /api/status
    |
    +-- SES Compras no disponible --> detener y mostrar aviso general
    |
    v
GET /api/comprobantes/reconciliar-pendientes
    |
    +-- Pendiente no resuelto ------> mostrar Operación pendiente
    |
    +-- Sin pendientes -------------> abrir formulario
```

`/api/status` no reemplaza la reconciliación. Sólo evita comenzar el flujo cuando
Node o PostgreSQL no están operativos. Los endpoints funcionales conservan su
propio manejo de errores porque una dependencia puede fallar después de una
verificación exitosa.

> Una respuesta exitosa de `/api/status` sólo confirma que Node y PostgreSQL
> estaban disponibles en ese instante. No garantiza su disponibilidad futura y
> no reemplaza el manejo de errores del endpoint funcional, las validaciones de
> negocio, la reconciliación ni el tratamiento de fallos ocurridos después de
> esa respuesta.

No se incorporan polling, intervalos ni reintentos automáticos. Una nueva
comprobación requiere una nueva acción del usuario.

---

# 7. Mensajes al operador

Los mensajes deben identificar la responsabilidad que falló sin exponer detalles
técnicos.

## A. Node no responde

**Título:** Servicio de Compras no disponible

**Mensaje:**

> No fue posible comunicarse con el servidor de SES Compras.
>
> El ingreso no puede continuar mientras el servicio no esté disponible.
>
> Verifique que el servicio se encuentre iniciado o comuníquese con el
> responsable del sistema.

No debe mencionar WinDev, Gestión Ventas ni una operación pendiente.

## B. PostgreSQL no está disponible

**Título:** Servicio de Compras no disponible

**Mensaje:**

> SES Compras no puede acceder temporalmente a la información del sistema.
>
> La operación no puede continuar. Comuníquese con el responsable del sistema.

El operador no recibe detalles técnicos de PostgreSQL.

## C. Existe una operación pendiente no resuelta

Se mantiene el diálogo vigente **Operación pendiente**. Este diálogo pertenece
al protocolo de reconciliación y no al endpoint general de estado.

## D. Gestión Ventas no está disponible

**Título sugerido:** Gestión Ventas no disponible

El mensaje debe indicar que la operación requiere conexión con Gestión Ventas y
no puede continuar. No debe mostrarse en módulos o acciones que no dependan de
WinDev.

---

# 8. Matriz inicial de dependencias

La matriz debe ampliarse cuando se incorporen procesos nuevos o cambien sus
responsabilidades.

| Módulo o proceso | SES Compras API | PostgreSQL | Gestión Ventas |
|---|---|---|---|
| Proveedores | Requerida | Requerida | No requerida |
| Cuenta Corriente | Requerida | Requerida | No requerida |
| Orden de Pago | Requerida | Requerida | No requerida inicialmente |
| Nuevo Comprobante - ingreso y carga | Requerida | Requerida | No requerida |
| Nuevo Comprobante - confirmación sin integración | Requerida | Requerida | No requerida |
| Nuevo Comprobante - confirmación con costo o stock | Requerida | Requerida | Requerida |
| Reconciliación de pendientes | Requerida | Requerida | Requerida |
| Remito con actualización de stock | Requerida | Requerida | Requerida |

La sincronización de maestros con HFSQL es un proceso diferente de la operación
normal de consulta del módulo Proveedores y debe documentar por separado sus
dependencias cuando se incorpore a esta matriz.

---

# 9. Alcance de la primera implementación

La primera implementación, mínima y transversal, se encuentra completada.

## Backend

- `GET /api/status` implementado;
- prueba liviana de conexión PostgreSQL mediante Prisma;
- respuesta JSON controlada;
- ruta transversal de estado activa.

## Frontend

- función reutilizable para consultar `/api/status`;
- uso al pulsar Nuevo Comprobante;
- aviso diferenciado cuando Node o PostgreSQL no están disponibles;
- detención del flujo antes de reconciliar.

No se incluyen todavía:

- `/api/status/windev`;
- panel visual permanente;
- indicadores en el encabezado;
- polling o cron;
- monitoreo histórico o métricas;
- alertas automáticas;
- reintentos en segundo plano.

`/api/status/windev` queda diseñado en este documento, pero se implementará en
una segunda etapa después de definir el endpoint de estado correspondiente en
WinDev.

---

# 10. Reutilización y separación de responsabilidades

La comprobación general no debe quedar codificada exclusivamente dentro de
`AppRouter` ni de `NuevoComprobante`.

La implementación futura debe ofrecer una función o servicio frontend
reutilizable, conceptualmente `verificarDisponibilidadCompras()`, sin imponer ese
nombre si las convenciones vigentes recomiendan otro.

Su responsabilidad será:

- invocar `/api/status`;
- interpretar la respuesta y los errores de conexión;
- devolver un resultado normalizado;
- no mostrar diálogos directamente;
- dejar la presentación en manos de la pantalla o del router.

En backend deben permanecer separadas:

- la ruta o el controlador HTTP;
- la comprobación de PostgreSQL;
- las futuras comprobaciones de servicios externos.

Esta separación no justifica crear una infraestructura compleja para dos
verificaciones simples.

---

# 11. Principios de diseño

1. Simplicidad antes que monitoreo complejo.
2. Cada módulo verifica sólo las dependencias que necesita.
3. El estado general de SES Compras no depende de WinDev.
4. Un endpoint de estado nunca modifica datos.
5. Un endpoint de estado no sustituye el manejo de errores del endpoint funcional.
6. Los mensajes al operador identifican correctamente la capa que falló.
7. Los detalles técnicos quedan en registros del servidor, no en el mensaje operativo.
8. No se utilizan consultas de negocio ficticias para comprobar disponibilidad.
9. No se agregan polling ni procesos en segundo plano en esta etapa.
10. La arquitectura permite incorporar futuras dependencias sin romper el contrato general.

---

# 12. Estado de las etapas

## Etapa 1 - Estado de SES Compras - Implementada y validada

- `/api/status` implementado;
- comprobación de PostgreSQL implementada;
- consumo reutilizable incorporado en frontend;
- aplicación inicial incorporada al ingreso de Nuevo Comprobante.

## Etapas futuras

Queda pendiente únicamente `GET /api/status/windev`. Su implementación:

- requerirá un endpoint específico de estado en Gestión Ventas API;
- informará exclusivamente la disponibilidad de Gestión Ventas;
- se utilizará sólo en procesos que requieran esa integración;
- no reemplazará la reconciliación ni las validaciones funcionales.

---

# 13. Pruebas

Los casos de la Etapa 1 fueron cubiertos mediante validación técnica, consulta
real del endpoint y simulaciones controladas de indisponibilidad. El caso que
depende de `/api/status/windev` permanece previsto para la Etapa 2.

1. **Node y PostgreSQL activos:** `/api/status` devuelve estado activo.
2. **Node detenido:** el frontend detecta el error de conexión, muestra
   `Servicio de Compras no disponible` y no ejecuta reconciliación.
3. **Node activo y PostgreSQL detenido:** `/api/status` devuelve un estado
   controlado no disponible y el frontend detiene el flujo.
4. **Estado general correcto y sin pendientes:** se ejecuta reconciliación y se
   abre Nuevo Comprobante.
5. **Estado general correcto y pendiente real:** se mantiene el diálogo
   `Operación pendiente`.
6. **WinDev detenido:** `/api/status` continúa indicando que SES Compras está
   disponible; la indisponibilidad externa se detecta sólo en el proceso que la
   requiere.
7. **Restauración del servicio:** una nueva acción manual permite continuar y no
   existen reintentos automáticos.

---

# 14. Pendientes de implementación

Permanece pendiente únicamente:

- implementar `GET /api/status/windev` en una etapa posterior, después de crear
  el endpoint específico de estado en Gestión Ventas API.

Esta verificación externa informará sólo la disponibilidad de Gestión Ventas y
no sustituirá la reconciliación ni las validaciones funcionales.
