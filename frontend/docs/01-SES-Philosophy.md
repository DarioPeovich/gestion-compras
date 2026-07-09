# SES Philosophy

Versión 1.0

---

# Introducción

SES no nació como un proyecto React.

SES nació hace más de treinta años como un sistema de gestión para estaciones de servicio.

Durante ese tiempo evolucionó continuamente acompañando los cambios tecnológicos, pero siempre conservó el mismo objetivo:

> Construir un sistema sencillo de utilizar para personas cuyo trabajo principal no es la informática.

El nuevo Frontend representa una evolución tecnológica del producto, no un cambio de filosofía.

---

# Nuestra prioridad

SES no intenta ser la aplicación más llamativa.

SES intenta ser la herramienta más cómoda para trabajar durante toda una jornada laboral.

El diseño nunca debe competir con la información.

La interfaz existe para facilitar el trabajo del operador.

---

# El operador es el protagonista

Cada decisión de diseño debe responder una pregunta sencilla.

> ¿Esto ayuda realmente al usuario?

Si la respuesta es negativa, la funcionalidad o el efecto visual debe reconsiderarse.

---

# Simplicidad

La simplicidad no significa falta de funcionalidades.

Significa eliminar todo aquello que no aporta valor al trabajo diario.

Una pantalla limpia suele ser más rápida de comprender que una pantalla espectacular.

---

# Consistencia

Todos los formularios del sistema deben construirse utilizando el mismo lenguaje visual.

El operador no debe aprender una interfaz diferente para cada módulo.

Proveedores, Clientes, Compras, Ventas, Stock y Tesorería deben sentirse parte del mismo sistema.

---

# Productividad

SES es un ERP.

Las decisiones visuales se toman pensando en operadores que utilizan el sistema durante muchas horas consecutivas.

La comodidad de uso tiene prioridad sobre las tendencias de diseño.

---

# El dato es el protagonista

Los colores, sombras y efectos visuales cumplen únicamente una función de organización.

Nunca deben competir con la información.

La información siempre ocupa el primer plano.

---

# Diseño por capas

La interfaz se organiza mediante una jerarquía clara.

SESLayout

↓

SESTopBar

↓

SESWorkspace

↓

SESSection

↓

SESFormRow

↓

SESField

↓

SESControl

↓

Controles

Cada componente posee una única responsabilidad.

---

# Design System

SES utiliza un Design System propio.

No intenta replicar Bootstrap, Material Design, Ant Design ni otras bibliotecas.

Las decisiones de diseño responden a las necesidades particulares de un ERP de escritorio adaptado al entorno web.

---

# Tecnología

El Frontend se desarrolla utilizando:

- React
- Vite
- Tailwind CSS
- shadcn/ui (como apoyo, no como identidad visual)

La identidad visual pertenece exclusivamente a SES.

---

# Evolución

El sistema continuará evolucionando.

La incorporación de nuevas tecnologías nunca deberá comprometer:

- la claridad de la interfaz;
- la consistencia visual;
- la productividad del operador;
- la simplicidad de uso.

---

# El Principio de Don Peovich

Durante el desarrollo del sistema existió una referencia constante.

El primer usuario importante de SES fue una persona nacida en 1933, que aprendió a utilizar el sistema para facturar, administrar clientes y emitir resúmenes de cuenta corriente.

Ese hecho dejó una enseñanza permanente.

La interfaz debe poder comprenderse sin capacitación extensa.

Si un operador necesita preguntar dónde se encuentra una función habitual, el diseño debe revisarse.

La claridad siempre tendrá prioridad sobre la estética.

---

# Una decisión permanente

SES no busca parecer moderno.

SES busca permanecer vigente.

Las tecnologías cambiarán.

Los frameworks cambiarán.

Las modas cambiarán.

La facilidad de uso nunca debería cambiar.

Ese es el verdadero objetivo del proyecto.
