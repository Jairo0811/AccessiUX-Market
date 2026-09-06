# NORTIC B2:2017 — Matriz de alineación de accesibilidad

AccessiUX Market adopta **voluntariamente** la NORTIC B2:2017 como referencia dominicana de accesibilidad web. La norma fue concebida para medios web del Estado dominicano; este proyecto no se presenta como portal gubernamental ni como producto certificado por una entidad pública.

## Objetivo

- Objetivo de conformidad del producto: **Nivel AA**.
- Base técnica: WCAG referenciada por NORTIC B2:2017.
- Validación automatizada: Playwright + axe-core en CI.
- Validación funcional: teclado, foco, formularios, navegación y procesos completos.

## Principios NORTIC aplicados

| NORTIC B2:2017 | Criterio | Implementación en AccessiUX Market | Evidencia |
|---|---|---|---|
| 3.01.1.a | Contenido no textual | Iconos decorativos con `aria-hidden`; controles con nombre accesible | UI + axe-core |
| 3.01.3.a | Información y relaciones | HTML semántico, landmarks, headings, labels y listas | Playwright + axe-core |
| 3.01.3.b | Secuencia significativa | DOM y orden de lectura coherentes | Pruebas E2E |
| 3.01.4.a | Uso del color | Estados y errores no dependen solo del color | UI + pruebas |
| 3.01.4.c | Contraste mínimo | Paleta diseñada con contraste y análisis automatizado | axe-core |
| 3.01.4.d | Cambio de tamaño del texto | Layout responsive y unidades relativas | Revisión UI |
| 3.02.1.a | Teclado | Controles nativos y navegación por teclado | Playwright |
| 3.02.1.b | Sin trampas para el foco | No se crean regiones que retengan el foco | Playwright |
| 3.02.4.a | Evitar bloques | Enlace “Saltar al contenido principal” | Playwright |
| 3.02.4.b | Titulado de páginas | Cada ruta principal define título descriptivo | Router + Playwright |
| 3.02.4.c | Orden de foco | Orden DOM compatible con la navegación visual | Playwright |
| 3.02.4.d | Propósito de enlaces | Enlaces con texto o nombre accesible descriptivo | axe-core |
| 3.02.4.f | Encabezados y etiquetas | Jerarquía de encabezados y labels descriptivos | Playwright + axe-core |
| 3.02.4.g | Foco visible | `:focus-visible` con indicador de alto contraste | CSS + Playwright |
| 3.03.1.a | Idioma de la página | Documento configurado en español | HTML |
| 3.03.2.c | Navegación coherente | Header/footer consistentes entre rutas | App shell |
| 3.03.2.d | Identificación coherente | Acciones equivalentes conservan nombre y comportamiento | UI |
| 3.03.3.a | Identificación de errores | Errores de formularios descritos mediante texto | Formularios |
| 3.03.3.b | Etiquetas o instrucciones | Inputs con label/nombre accesible | Playwright |
| 3.03.3.c | Sugerencias ante errores | Mensajes accionables cuando la corrección es conocida | Formularios |
| 3.03.3.d | Prevención de errores financieros | Checkout con etapa de revisión y confirmación explícita antes de crear el pedido | Checkout E2E |
| 3.04.1.a | Procesamiento | Angular genera marcado estructurado y IDs controlados | Build + axe-core |
| 3.04.1.b | Nombre, función, valor | Controles nativos/ARIA y estados anunciables | axe-core |

## Páginas y procesos completos

NORTIC B2:2017 establece que la conformidad no debe evaluarse únicamente sobre componentes aislados. AccessiUX Market trata como procesos completos, entre otros:

1. Registro / autenticación.
2. Navegación y filtrado del catálogo.
3. Detalle de producto → carrito.
4. Carrito → checkout → revisión → confirmación.
5. Gestión de cuenta.
6. Flujo de vendedor.

El CI ejecuta pruebas sobre páginas públicas y flujos autenticados relevantes, y el alcance crecerá junto con cada fase del roadmap.

## Prevención de errores en Checkout

Para la transacción económica, el sistema implementa una barrera previa a la confirmación:

1. El usuario completa los datos requeridos.
2. El backend genera/revalida la revisión de compra.
3. La interfaz presenta dirección, método de pago, productos y total.
4. El usuario debe indicar explícitamente que revisó la información.
5. Solo entonces se habilita la confirmación final.

Esto materializa el criterio NORTIC **3.03.3.d — Prevención de errores (legales, financieros, datos)**.

## No certificación

Esta matriz expresa **alineación técnica y objetivos de conformidad**. No debe interpretarse como certificación oficial NORTIC, auditoría gubernamental aprobada ni declaración de cumplimiento emitida por una autoridad dominicana.
