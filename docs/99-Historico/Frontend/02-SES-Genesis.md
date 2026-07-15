# SES Genesis

## El nacimiento del Design System de SES

Versión: 1.0

Julio 2026

---

# Introducción

Este documento no describe componentes.

No describe React.

No describe Tailwind.

Este documento describe las decisiones que dieron origen al nuevo Frontend de SES.

Su objetivo es preservar la intención del proyecto.

Las tecnologías cambiarán.

Los componentes cambiarán.

La filosofía no debería cambiar.

---

# La historia de SES

SES nació hace más de treinta años como un sistema para Estaciones de Servicio.

Su nombre original significa:

Sistema para Estaciones de Servicio.

Con el paso del tiempo evolucionó hasta convertirse en un ERP capaz de administrar distintos tipos de comercios.

A pesar de esa evolución, siempre conservó una característica.

La facilidad de uso.

---

# El origen de esta filosofía

Durante el desarrollo original del sistema, uno de los usuarios principales fue el padre del autor.

Nacido en 1933.

Aprendió a:

- facturar
- administrar clientes
- emitir resúmenes de cuenta corriente
- trabajar diariamente con SES

Esa experiencia dejó una enseñanza permanente.

Una buena interfaz no es aquella que impresiona.

Es aquella que desaparece mientras el usuario trabaja.

---

# El problema

Durante el desarrollo del nuevo módulo de Compras en React comenzaron a evaluarse distintas alternativas de diseño.

La primera intención fue utilizar componentes tradicionales de React apoyándose en Tailwind y shadcn/ui.

Sin embargo, rápidamente apareció una duda.

¿Cómo mantener la identidad de SES después de treinta años?

La respuesta fue clara.

No copiar otros frameworks.

Construir uno propio.

---

# El nacimiento del Design System

La decisión más importante del proyecto fue separar completamente la lógica de negocio de la interfaz.

La lógica continúa perteneciendo al ERP.

La presentación pertenece al Design System SES.

Esto permite evolucionar visualmente el sistema sin modificar su comportamiento funcional.

---

# Objetivo

No construir una aplicación web moderna.

Construir la evolución natural de SES.

El usuario debe sentir que está utilizando el mismo producto de siempre.

Simplemente adaptado a las tecnologías actuales.

---

# Principios

## La información es protagonista

La interfaz nunca debe competir con los datos.

Todo elemento visual debe ayudar a comprender la información.

Nunca distraer.

---

## Productividad

SES es un ERP.

No una landing page.

No una aplicación de demostración.

Las personas trabajan muchas horas consecutivas utilizando el sistema.

La comodidad tiene prioridad sobre las tendencias visuales.

---

## Consistencia

Todos los módulos deben sentirse iguales.

Ventas.

Compras.

Clientes.

Stock.

Tesorería.

No deben parecer aplicaciones diferentes.

---

## Simplicidad

La simplicidad no significa ausencia de funcionalidades.

Significa eliminar todo aquello que no aporta valor.

---

## Evolución

SES no pretende parecer moderno.

Pretende permanecer vigente durante muchos años.

---

# La gran decisión

Durante el diseño del Frontend se abandonó la idea de construir simplemente componentes React.

En su lugar se decidió construir un lenguaje propio.

Por esa razón aparecieron componentes como:

SESWorkspace

SESSection

SESFormRow

SESField

SESControl

SESInput

SESSelect

Estos componentes representan conceptos del negocio.

No etiquetas HTML.

---

# Filosofía del desarrollo

Cuando exista un componente SES nunca deberá utilizarse directamente HTML.

Por ejemplo.

No:

<input>

Sí:

<SESInput>

No:

<select>

Sí:

<SESSelect>

No:

<div class="grid">

Sí:

<SESFormRow>

El objetivo es que el código describa procesos del ERP y no detalles de implementación.

---

# Estrategia de migración

La migración será gradual.

Nunca se reescribirá completamente un formulario funcionando.

Cada pantalla evolucionará por secciones.

La lógica de negocio permanecerá intacta.

Únicamente cambiará la capa visual.

---

# El verdadero objetivo

El éxito del proyecto no será obtener una interfaz espectacular.

Será lograr que un operador pueda sentarse frente a SES y comenzar a trabajar inmediatamente.

Si dentro de algunos años un usuario no recuerda cuándo aprendió a utilizar el sistema, significará que la interfaz cumplió su propósito.

---

# Una frase para recordar

SES no busca parecer moderno.

SES busca permanecer vigente.

---

# Compromiso

Toda decisión futura sobre el Frontend deberá responder una única pregunta.

¿Esta decisión mejora realmente la experiencia del operador sin comprometer la simplicidad del sistema?

Si la respuesta es negativa, la decisión deberá reconsiderarse.

---

# Este documento

Este documento debe leerse antes de modificar el Design System.

No explica cómo está construido SES.

Explica por qué está construido de esta manera.

Mientras esta filosofía se mantenga, el sistema podrá evolucionar tecnológicamente sin perder su identidad.
