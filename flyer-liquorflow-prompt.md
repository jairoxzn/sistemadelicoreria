# Prompt para flyer publicitario de LiquorFlow

Prompt listo para pegar en un generador de imágenes con IA (Ideogram, DALL·E 3 / ChatGPT, Midjourney con `--style raw`, Canva Magic Media, etc.) para crear el material publicitario del sistema **LiquorFlow** (POS + catálogo digital para licorerías).

---

## 1. Identidad visual del sistema (para que el flyer sea consistente con el producto real)

- **Colores principales:**
  - Fondo oscuro: `#111318` (negro azulado) y `#1B1E26` (gris carbón)
  - Acento principal: dorado/ámbar cálido (`#D9A62E` aprox. — es el color de los botones "Agregar al carrito" y acentos del sistema)
  - Texto claro sobre fondo oscuro: blanco / `#F5F5F5`
- **Ícono de marca:** una copa de vino/licor estilizada (`Wine` de Lucide), en círculo dorado sobre fondo oscuro
- **Tono:** profesional, moderno, "premium pero accesible" — para dueños de licorerías, minimarkets y distribuidoras, no para consumidores finales
- **Tipografía sugerida:** sans-serif geométrica y limpia para títulos (peso bold/extrabold), texto de apoyo más ligero

---

## 2. Contenido que debe incluir el flyer

**Nombre del producto:** LiquorFlow
**Tagline sugerido:** "El sistema todo-en-uno para tu licorería" / "Vende más, controla todo, desde un solo lugar"

**Funcionalidades clave a destacar (elige 5-7 para no saturar el diseño):**

- 🖥️ Punto de Venta (POS) rápido con múltiples métodos de pago
- 📦 Control de inventario en tiempo real, multi-sucursal
- 🛒 Catálogo digital público con carrito de compras
- 📱 Código QR para que tus clientes compren desde el celular
- 💬 Pedidos directos por WhatsApp, sin comisiones
- 🏷️ Promociones y combos (2x1, descuentos, precios especiales)
- 📊 Dashboard con reportes de ventas, ganancias y productos más vendidos
- 🔔 Alertas automáticas de stock bajo y compras pendientes
- 🧾 Boletas/tickets con tu logo impresos al instante
- 👥 Roles de usuario (administrador, cajero, almacenero, supervisor)
- 🏬 Gestión de compras, proveedores y clientes
- 🔒 Auditoría completa de cada movimiento del negocio

**Llamado a la acción (CTA):** algo como "Digitaliza tu licorería hoy" + espacio para logo/contacto del negocio que lo va a usar.

---

## 3. Prompt para el generador de imágenes (copiar y pegar)

```
Diseña un flyer publicitario digital, moderno y profesional para promocionar
"LiquorFlow", un sistema de punto de venta (POS) y catálogo digital para
licorerías. Estilo premium, tecnológico, orientado a dueños de negocio.

Fondo: degradado oscuro entre negro azulado (#111318) y gris carbón (#1B1E26).
Color de acento: dorado ámbar cálido (#D9A62E), usado en el logo, íconos,
botones y detalles decorativos.

Composición:
- Arriba: logotipo con un ícono de copa de licor estilizada en círculo dorado,
  junto al texto "LiquorFlow" en tipografía bold blanca, y debajo el tagline
  "El sistema todo-en-uno para tu licorería" en dorado.
- Centro: mockup de un smartphone y una laptop/tablet mostrando pantallas del
  sistema: en el celular, un catálogo de licores con carrito de compras y
  botón "Agregar al carrito" en dorado; en la laptop, un dashboard oscuro con
  gráficos de ventas, tarjetas de estadísticas y una tabla de inventario.
- Alrededor de los dispositivos: iconos flotantes minimalistas en dorado
  representando: código QR, WhatsApp, campana de notificación, caja
  registradora, gráfico de barras, etiqueta de oferta/promoción, factura/ticket.
- Lista de 6 funcionalidades clave con íconos pequeños en columna o grid,
  texto corto y legible en blanco: "Punto de venta rápido", "Inventario en
  tiempo real", "Catálogo con QR y WhatsApp", "Promociones y combos",
  "Reportes y dashboard", "Multi-sucursal y roles de usuario".
- Abajo: llamado a la acción en texto grande dorado: "Digitaliza tu licorería
  hoy" y un espacio limpio en la esquina inferior para agregar datos de
  contacto/logo del negocio.

Estilo: diseño plano moderno (flat design) con toques de glassmorphism sutil,
alto contraste, mucho espacio en blanco/negativo, sin texto genérico de stock,
apto para impresión y para redes sociales. Sin marcas de agua. Alta resolución.
```

---

## 4. Variantes según el formato

- **Post cuadrado (Instagram/Facebook, 1080x1080):** usa el mismo prompt pero indica `formato cuadrado 1:1` y reduce la lista de funcionalidades a 4.
- **Historia/Story (1080x1920):** indica `formato vertical 9:16`, mockup de solo el celular (catálogo), texto más grande y centrado.
- **Flyer imprimible (A4 o A5):** indica `formato vertical A4, para imprimir, 300dpi`, deja más espacio en blanco en los bordes y agrega la lista completa de 12 funcionalidades en dos columnas.
- **Banner web (1200x628, para anuncios):** indica `formato horizontal 1200x628`, un solo mockup (laptop con el dashboard) y máximo 3 funcionalidades destacadas.

---

## 5. Tips al usarlo

- Si el generador no maneja bien texto en español dentro de la imagen (pasa con Midjourney), pide la imagen **sin texto** y luego agrega los textos (título, tagline, lista de funciones, CTA) con Canva o Figma usando la paleta de colores de la sección 1 — así el texto queda perfecto y editable.
- Si quieres variar el mensaje según a quién le vendes el sistema (a un solo licorería vs. a varias sucursales), ajusta el tagline y qué 5-7 funcionalidades destacas primero.
