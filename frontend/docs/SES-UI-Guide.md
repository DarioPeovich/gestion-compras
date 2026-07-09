# 0. Historia

SES nació como un sistema DOS para estaciones de servicio.

Con el paso de los años evolucionó hasta convertirse en un ERP para distintos tipos de comercios.

La tecnología cambió.

La filosofía no.

El objetivo de SES siempre fue ayudar a las personas a trabajar mejor.

La nueva interfaz mantiene ese principio.

No busca sorprender.

Busca acompañar jornadas completas de trabajo con una experiencia clara, rápida y consistente.
# SES Design Guide
## Versión 1.0
### Peovich Soft

> "El diseño de SES debe facilitar el trabajo diario de las personas.
> La estética es importante, pero nunca debe interferir con la productividad."

---

# 1. Filosofía

SES es un ERP.

No es una página institucional.

No es un e-commerce.

No es una aplicación móvil.

Las personas trabajan durante horas utilizando SES.

Por lo tanto el diseño debe privilegiar:

- claridad
- rapidez
- consistencia
- legibilidad
- comodidad visual

sobre cualquier tendencia estética.

---

# 2. Principios

## 2.1 Consistencia

Un mismo elemento siempre debe verse igual.

Ejemplo:

- todos los botones primarios son iguales
- todas las secciones son iguales
- todos los títulos tienen el mismo estilo

El usuario nunca debe reaprender una pantalla.

---

## 2.2 Información antes que decoración

Cada color, borde, sombra o icono debe comunicar algo.

Nunca se utilizarán elementos únicamente decorativos.

---

## 2.3 Mucho espacio en blanco

El espacio vacío mejora la lectura.

Nunca intentar aprovechar todos los píxeles disponibles.

---

## 2.4 Jerarquía visual

La pantalla debe poder recorrerse visualmente.

Título

↓

Sección

↓

Formulario

↓

Acciones

↓

Resumen

---

# 3. Identidad visual

## Estilo

Profesional

Moderno

Sobrio

Confiable

Minimalista

No futurista.

No infantil.

No llamativo.

---

# 4. Colores

El azul será el color institucional de SES.

Representa:

- confianza
- estabilidad
- experiencia

Los colores de estado serán:

🟢 éxito

🟡 advertencia

🔴 error

🔵 información

Nunca utilizar colores para decoración.

---

# 5. Tipografía

Fuente principal

Inter

Características

- excelente lectura
- moderna
- neutra

Importes

Roboto Mono

Motivo

Los números alineados facilitan la lectura de importes.

---

# 6. Espaciado

Todos los espacios utilizarán una escala.

4

8

12

16

24

32

48

Nunca utilizar medidas arbitrarias.

---

# 7. Bordes

Los radios serán consistentes.

Pequeño

8 px

Mediano

12 px

Grande

20 px

---

# 8. Sombras

Las sombras deben ser suaves.

Nunca utilizar sombras negras intensas.

Las tarjetas deben separarse del fondo, no parecer flotantes.

---

# 9. Layout

SES utilizará una grilla de 12 columnas.

Los formularios deberán reorganizarse automáticamente según el ancho disponible.

Desktop

→ varias columnas

Notebook

→ menos columnas

Tablet

→ una o dos columnas

Celular

→ solamente módulos administrativos o consultas.

No se pretende utilizar un teléfono para cargar una factura completa.

---

# 10. Componentes

El Design System estará compuesto inicialmente por:

SESPage

SESHeader

SESSection

SESButton

SESInput

SESSelect

SESTable

SESSummaryCard

SESBadge

SESDialog

---

# 11. Temas

SES soportará múltiples temas.

Inicialmente:

SES Modern

SES Classic

SES Midnight

SES Ocean

SES Glacier

Todos los componentes deberán obtener sus colores desde el Theme Manager.

Nunca deberán utilizar colores hardcodeados.

---

# 12. Accesibilidad

Todo componente deberá:

- soportar navegación con teclado
- mostrar foco visible
- poseer contraste suficiente
- utilizar tamaños de fuente legibles

---

# 13. Responsive

El objetivo del responsive no es adaptar todo a un teléfono.

El objetivo es ofrecer la mejor experiencia posible en:

- monitores grandes
- notebooks
- tablets

Los módulos POS continuarán optimizados para escritorio.

---

# 14. Filosofía de desarrollo

Antes de crear un nuevo componente preguntarse:

¿Puede reutilizarse en otro módulo?

Si la respuesta es no...

Debe replantearse el diseño.

---

# 15. Regla de oro

La lógica de negocio es sagrada.

La interfaz puede evolucionar constantemente.

Nunca se modificará una regla de negocio únicamente para simplificar la interfaz.

La UI se adapta al negocio.

Nunca al revés.

---

© SES ERP
Peovich Soft