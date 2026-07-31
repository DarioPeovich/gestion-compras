# Guía de Desarrollo para Asistentes de IA

**Proyecto:** SES Compras  
**Versión:** Compras v1.1.0  
**Estado:** Documento normativo

## 1. Propósito

Esta guía establece las reglas permanentes que debe seguir todo asistente de inteligencia artificial que participe en el desarrollo, diagnóstico, validación o documentación de SES Compras.

Su propósito es:

- preservar la continuidad entre tareas y conversaciones;
- mantener la coherencia con la arquitectura vigente;
- proteger la estabilidad funcional del sistema;
- asegurar la consistencia de la documentación;
- sostener un nivel uniforme de calidad técnica;
- facilitar la incorporación de nuevos asistentes de IA sin depender de contexto conversacional previo.

Las instrucciones específicas de cada tarea complementan esta guía. Cuando una tarea autorice un alcance determinado, el asistente debe actuar dentro de ese límite y evitar cambios colaterales.

## 2. Documentación oficial y lectura obligatoria

Antes de diagnosticar o modificar el proyecto, el asistente debe consultar la documentación oficial en el siguiente orden:

1. [Roadmap.md](Roadmap.md), para conocer la etapa vigente, los objetivos futuros y los límites funcionales del producto.
2. [Estado-Actual.md](Estado-Actual.md), para identificar qué está implementado, validado, pendiente o condicionado por deuda técnica.
3. [CHANGELOG.md](CHANGELOG.md), para comprender la evolución reciente y no revertir decisiones ya incorporadas.
4. Los documentos técnicos del módulo afectado, según el alcance de la tarea.

Entre los documentos técnicos de referencia se encuentran:

- [Frontend-v1-Consolidacion.md](../Frontend/Frontend-v1-Consolidacion.md), para la arquitectura consolidada del frontend;
- [01-Filosofia-y-Arquitectura.md](../01-Backend/01-Filosofia-y-Arquitectura.md), documento maestro de arquitectura del backend;
- los documentos de modelo de datos, API REST, especificación funcional, integración Node--WinDev y operación ubicados en `docs/01-Backend`;
- la documentación histórica de `docs/99-Historico`, únicamente como antecedente y no como fuente vigente cuando contradiga documentos actuales.

La lectura debe realizarse antes de proponer cambios. Si la documentación y la implementación difieren, el asistente debe informar la discrepancia y determinar cuál representa el estado comprobable, sin corregirla fuera del alcance autorizado.

## Documentación mínima según el tipo de tarea

La documentación mínima obligatoria depende del alcance de la intervención:

| Tipo de tarea | Documentación mínima obligatoria |
| --- | --- |
| Frontend | `Roadmap.md` + `Estado-Actual.md` + `Frontend-v1-Consolidacion.md` |
| Backend | `Roadmap.md` + `Estado-Actual.md` + documentación técnica del backend correspondiente |
| Base de datos | `Roadmap.md` + `Estado-Actual.md` + migraciones + documentación técnica del backend |
| Design System | `Roadmap.md` + `Frontend-v1-Consolidacion.md` |
| Documentación | `Guia-Desarrollo-IA.md` + `Roadmap.md` + documento que se modificará |

El asistente debe cargar únicamente el contexto necesario para la tarea que realizará. Debe evitar incorporar documentación no relacionada, sin omitir las fuentes mínimas ni las referencias directamente vinculadas con el alcance.

## 3. Jerarquía documental

Cada documento tiene una responsabilidad propia:

- **Roadmap:** expresa la dirección del producto, las etapas, los objetivos futuros y su estado general. No es un backlog detallado ni un registro exhaustivo de cambios.
- **Estado Actual:** describe la situación funcional y técnica vigente, incluyendo capacidades implementadas, validaciones, pendientes y riesgos conocidos.
- **CHANGELOG:** registra cambios efectivamente incorporados y los agrupa por versión. No debe contener trabajo meramente proyectado.
- **Documentos técnicos por módulo:** explican arquitectura, decisiones, contratos, reglas de negocio, modelo de datos, integración, operación o diseño de un área específica.
- **Documentos DOCX:** son representaciones derivadas para distribución, presentación o impresión. No constituyen una fuente técnica independiente.

No debe duplicarse una misma responsabilidad documental. Una decisión debe registrarse en el documento especializado correspondiente y sólo resumirse en Estado Actual, CHANGELOG o Roadmap cuando su función lo requiera.

## 4. Política documental

Los archivos Markdown son la única fuente oficial de documentación técnica del proyecto. Todo cambio documental comienza en Markdown y toda versión Word se genera desde el Markdown vigente.

```text
Cambio del proyecto
        |
        v
Actualización del Markdown correspondiente
        |
        v
Revisión técnica y funcional
        |
        v
Generación del DOCX derivado
```

Reglas obligatorias:

- crear y mantener primero el archivo Markdown;
- no editar manualmente un DOCX técnico;
- no utilizar un DOCX como origen para reemplazar el Markdown oficial;
- resolver cualquier diferencia a favor del Markdown revisado;
- generar el DOCX únicamente como último paso y cuando la tarea lo solicite expresamente;
- mantener trazabilidad entre el documento derivado y su fuente Markdown.

## 5. Respeto por la arquitectura vigente

El desarrollo debe preservar las decisiones documentadas. En particular, SES Compras evoluciona de forma incremental sobre una arquitectura donde React presenta la interfaz, Node.js coordina el módulo, PostgreSQL conserva la persistencia documental y WinDev/HFSQL mantienen responsabilidades operativas y maestros definidos.

El asistente debe:

- respetar las fronteras entre frontend, backend, PostgreSQL, WinDev y HFSQL;
- conservar contratos HTTP, reglas de negocio, persistencia e idempotencia salvo autorización explícita;
- evitar refactorizaciones generales como consecuencia incidental de una tarea puntual;
- justificar cualquier cambio estructural por una necesidad comprobable;
- proteger flujos ya estabilizados y validados;
- extender puntos existentes antes de introducir arquitecturas paralelas;
- tratar las decisiones registradas como restricciones activas hasta que una tarea autorice revisarlas.

Una preferencia estilística no es motivo suficiente para alterar una arquitectura funcional.

En toda integración distribuida, un `ERROR` confirmado por el sistema remoto debe tratarse como un resultado definitivo. Si la operación todavía forma parte de la transacción local, debe preferirse el rollback de esa transacción antes que una compensación posterior. La idempotencia no reemplaza validaciones ni reglas de negocio: su único objetivo es resolver la incertidumbre producida por fallas de comunicación que impiden conocer el resultado real de una operación.

### Política de verificación de disponibilidad

Todo flujo que dependa de servicios externos debe verificar previamente la disponibilidad de las dependencias requeridas. Debe reutilizar el mecanismo estándar del proyecto:

```text
GET /api/status
GET /api/status/{servicio}
```

La verificación previa evita iniciar operaciones cuando una dependencia necesaria no está disponible. No reemplaza las validaciones funcionales, la reconciliación, el manejo de errores ni los controles posteriores del proceso, porque una respuesta exitosa de estado no garantiza la disponibilidad futura del servicio.

Los módulos nuevos deben reutilizar este mecanismo transversal y no implementar verificaciones particulares, duplicadas o basadas en operaciones de negocio ficticias.

### Evaluación previa a una refactorización

Antes de proponer una refactorización, el asistente debe evaluar si el objetivo puede alcanzarse mediante una modificación incremental.

Sólo debe proponer una refactorización estructural cuando exista una justificación técnica clara que demuestre que una evolución incremental no resulta suficiente.

Como criterio general del proyecto, debe priorizarse la evolución controlada sobre la reescritura.

## 6. Forma de desarrollo

La forma de trabajo preferida es incremental, reversible y de bajo riesgo.

- Realizar cambios pequeños y delimitados.
- Reutilizar componentes, utilidades y convenciones existentes cuando correspondan.
- Mantener compatibilidad con los flujos no incluidos en la tarea.
- Elegir la solución más simple que satisfaga el requisito completo.
- Separar correcciones funcionales, refactorizaciones y documentación en etapas identificables.
- No reescribir módulos completos salvo instrucción expresa y justificación arquitectónica.
- No introducir dependencias, estados, abstracciones o archivos preparados para necesidades futuras no implementadas.
- Preservar el comportamiento comprobado mientras se mejora la estructura.
- Cuando un proceso distribuido requiera reconciliación, reutilizar siempre el identificador idempotente original, consultar el estado remoto antes de decidir y no reenviar automáticamente una operación incierta.
- Documentar el protocolo de reconciliación junto con el proceso principal al que pertenece.

Las modificaciones mecánicas deben conservar contratos, callbacks, transformaciones, estilos y resultados observables, salvo que el objetivo declarado indique lo contrario.

## 7. Documentación durante el desarrollo

Durante cada tarea, el asistente debe evaluar si el cambio introduce o modifica alguna de estas categorías:

- decisión arquitectónica;
- regla de negocio;
- proceso operativo;
- organización documental;
- convención técnica;
- componente o criterio del Design System;
- integración entre sistemas;
- contrato externo o responsabilidad entre dominios.

Si existe impacto documental, debe indicar explícitamente qué debería documentarse y en cuál documento oficial. Si no existe, debe dejar constancia de que el cambio no requiere actualización documental.

Esta evaluación no autoriza a modificar documentación. El asistente sólo debe editarla cuando la tarea lo solicite expresamente o incluya de forma inequívoca la actualización documental dentro de su alcance.

Cuando una modificación afecte un protocolo distribuido, una integración entre sistemas o un mecanismo de idempotencia, la actualización autorizada debe seguir este orden:

1. documento técnico especializado responsable del protocolo;
2. `Estado-Actual.md`;
3. `CHANGELOG.md`;
4. `Roadmap.md`, cuando el cambio afecte etapas, prioridades o estado general.

El documento especializado debe registrar primero el diseño y el comportamiento completo. Los demás documentos sólo se sincronizan después, de acuerdo con su responsabilidad.

## 8. Generación de documentación

El proceso obligatorio de creación documental es:

1. identificar el documento oficial responsable del tema;
2. crear o actualizar el Markdown;
3. revisar contenido, estructura, enlaces, versión y coherencia técnica;
4. validar el diff y el estado del repositorio;
5. generar el DOCX, si fue solicitado, desde el Markdown aprobado;
6. verificar visualmente el documento derivado sin convertirlo en una fuente editable independiente.

El flujo inverso `DOCX → Markdown` no es un procedimiento normal del proyecto. Sólo puede utilizarse como recuperación excepcional de información histórica, con revisión humana y sin reemplazar automáticamente la fuente oficial.

Los documentos técnicos especializados constituyen la fuente de verdad de su dominio. `Roadmap.md`, `Estado-Actual.md` y `CHANGELOG.md` deben limitarse a resumir esa información según su responsabilidad y no deben reemplazar, duplicar ni reinterpretar el protocolo técnico completo.

## 9. Metodología de trabajo

Toda intervención debe seguir esta secuencia:

```text
Diagnóstico
    ↓
Diseño
    ↓
Plan
    ↓
Implementación
    ↓
Validación
    ↓
Documentación
```

### Diagnóstico

Comprender el comportamiento actual mediante lectura del código, documentación, configuración, migraciones, contratos y referencias reales. No asumir estructuras ni dependencias sin verificarlas.

### Diseño

Definir el resultado esperado, los límites, las invariantes que deben preservarse y la alternativa de menor impacto.

### Plan

Identificar archivos, orden de cambios, validaciones y condiciones de detención. El plan debe ser proporcional a la tarea.

### Implementación

Modificar únicamente lo autorizado, sin incorporar mejoras ajenas ni ampliar el alcance por conveniencia.

### Validación

Ejecutar las verificaciones solicitadas y las técnicamente proporcionales al riesgo: inspección de diff, sintaxis, lint, pruebas, build o comprobaciones funcionales. No declarar pruebas que no se ejecutaron.

### Documentación

Actualizar las fuentes oficiales sólo cuando esté autorizado y registrar el estado real, distinguiendo implementación, validación y trabajo pendiente.

## 10. Reglas para redactar prompts de Codex

Un prompt de implementación debe incluir, como mínimo:

- **objetivo:** resultado concreto que debe alcanzarse;
- **alcance:** flujo, módulo o comportamiento incluido;
- **archivos a revisar y modificar:** rutas conocidas y permiso sobre dependencias reales;
- **archivos o áreas que no deben modificarse:** límites explícitos;
- **comportamiento que debe preservarse:** contratos, reglas, estilos y flujos no afectados;
- **validaciones obligatorias:** comandos, directorio de ejecución y pruebas esperadas;
- **informe final:** evidencias que deben comunicarse;
- **restricción de alcance:** prohibición de optimizaciones o refactorizaciones innecesarias;
- **política de commit:** indicar expresamente si se autoriza o prohíbe realizarlo.

Los prompts deben distinguir diagnóstico, implementación, validación y documentación. Una tarea de diagnóstico no implica permiso para editar. Una tarea de implementación no implica permiso para hacer commit, cambiar contratos o documentar áreas no mencionadas.

Cuando una tarea incluya implementación y documentación, ambas deben ejecutarse como etapas independientes y respetar este orden general:

```text
Diseño
    ↓
Implementación
    ↓
Validación
    ↓
Documentación
    ↓
Commit
```

La documentación sólo debe actualizarse después de validar la implementación correspondiente. Dentro de la etapa documental debe conservarse el orden de actualización definido por la política documental vigente. El commit constituye una etapa posterior y sólo puede realizarse cuando el prompt lo autorice expresamente.

Cuando un prompt tenga alcance documental, debe indicar explícitamente:

- el documento responsable que puede modificarse;
- los documentos fuente que deben consultarse;
- los documentos y áreas que no pueden modificarse;
- la prohibición de alterar código cuando el alcance sea exclusivamente documental.

## 11. Inicio de nuevas conversaciones

Al comenzar una conversación nueva sobre SES Compras, el asistente debe:

1. leer esta guía;
2. leer Roadmap, Estado Actual y CHANGELOG en el orden establecido;
3. consultar los documentos técnicos del módulo afectado;
4. revisar el estado del repositorio sin modificarlo;
5. resumir, antes de una intervención amplia, el estado vigente, la arquitectura relevante, la etapa actual del Roadmap, las prioridades y los riesgos aplicables;
6. identificar cambios preexistentes para no atribuirlos a la nueva tarea ni sobrescribirlos;
7. confirmar el alcance y respetar las restricciones particulares del pedido.

El asistente no debe depender de la memoria de conversaciones anteriores. La continuidad debe reconstruirse desde el repositorio y su documentación oficial.

## 12. Principios generales

1. **Comprender antes de modificar.** Toda acción debe partir de evidencia del repositorio.
2. **Respetar el alcance.** No convertir una tarea puntual en una refactorización general.
3. **Preservar la estabilidad.** Los flujos validados son invariantes salvo autorización explícita.
4. **Mantener una única fuente de verdad.** Markdown prevalece en la documentación técnica.
5. **Distinguir responsabilidades.** Cada capa, sistema y documento debe conservar su propósito.
6. **Preferir evolución incremental.** Los cambios pequeños, compatibles y reversibles reducen riesgo.
7. **No inventar estado ni funcionalidades.** Toda afirmación y propuesta debe derivarse del proyecto o del requisito.
8. **Validar con honestidad.** Deben informarse resultados reales, advertencias, limitaciones y pruebas pendientes.
9. **Proteger el trabajo existente.** Los cambios previos del usuario o de otras tareas no deben alterarse ni presentarse como propios.
10. **No realizar acciones irreversibles sin autorización.** Commits, cambios de contratos, migraciones, despliegues y operaciones externas requieren alcance explícito.
11. **Las decisiones arquitectónicas implementadas, probadas y documentadas forman parte del proyecto.** Una decisión validada deja de considerarse una alternativa abierta. El asistente no debe volver a proponer soluciones descartadas, salvo que exista una nueva necesidad funcional o una instrucción explícita para revisar la decisión.

El cumplimiento de estos principios es obligatorio para cualquier asistente de IA que participe en SES Compras.
