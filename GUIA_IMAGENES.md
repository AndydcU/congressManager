# Guía de Imágenes - Congreso de Tecnología

## 📸 Imágenes a Agregar

Todas las imágenes deben colocarse en la carpeta `public/` de tu proyecto.

### 1. Logo del Congreso
**Archivo:** `public/logo-congreso.png`  
**Tamaño recomendado:** 200x80 píxeles  
**Formato:** PNG con fondo transparente  
**Ubicación en código:** Navbar (actualmente usa placeholder "CT")

**Cómo reemplazar:**
El código ya está preparado. Solo necesitas:
1. Guardar tu logo en `public/logo-congreso.png`
2. En `src/components/Navbar.jsx` línea 29-32, descomentar/modificar:
```javascript
{/* Reemplazar el div con gradiente por: */}
<img 
  src="/logo-congreso.png" 
  alt="Logo Congreso" 
  className="h-10 w-auto"
/>
```

**Alternativa si no tienes logo:** El placeholder "CT" en gradiente azul-índigo se ve profesional.

---

### 2. Imagen de Fondo Hero (Principal)
**Archivo:** `public/hero-background.jpg`  
**Tamaño recomendado:** 1920x1080 píxeles (Full HD)  
**Formato:** JPG o PNG  
**Contenido sugerido:** 
- Imagen de tecnología (código, circuitos, robots)
- Estudiantes trabajando en computadoras
- Campus universitario con tecnología

**Estado actual:** 
- Ya está configurado en `src/app/page.js` línea 28-32
- Si no colocas imagen, se verá el gradiente azul-índigo (se ve bien)
- Al agregar la imagen, se aplicará un overlay azul semitransparente automáticamente

**No requiere cambios en código** - solo coloca la imagen

---

### 3. Patrón de Fondo General (Opcional)
**Archivo:** `public/pattern-bg.svg`  
**Tamaño:** Pequeño (100x100 a 400x400 px)  
**Formato:** SVG  
**Contenido:** Patrón geométrico sutil

**Estado actual:**
- Ya hay un patrón de líneas sutiles en CSS
- Esta imagen es OPCIONAL para hacerlo más personalizado

**Para agregar:**
1. Guardar patrón en `public/pattern-bg.svg`
2. En `src/styles/globals.css` línea 4-7, cambiar:
```css
body {
  background-color: #f8fafc;
  background-image: url('/pattern-bg.svg');
  background-size: 400px 400px;
  background-attachment: fixed;
}
```

---

## 🎨 Herramientas Recomendadas para Crear Imágenes

### Para Logo:
- **Canva** (gratis): https://www.canva.com/
- **Figma** (gratis): https://www.figma.com/
- **LogoMakr** (gratis): https://logomakr.com/

### Para Hero Background:
- **Unsplash** (fotos gratis): https://unsplash.com/s/photos/technology
- **Pexels** (fotos gratis): https://www.pexels.com/search/technology/
- **Búsqueda:** "technology", "coding", "students technology", "computer science"

### Para Patrones:
- **Hero Patterns** (gratis): https://heropatterns.com/
- **Pattern Monster** (gratis): https://pattern.monster/
- **SVG Backgrounds** (gratis): https://www.svgbackgrounds.com/

---

## 📐 Especificaciones Técnicas

### Logo (logo-congreso.png)
```
Dimensiones: 200x80 px (aprox)
DPI: 72-150
Formato: PNG-24 con transparencia
Peso máximo: 100 KB
Colores sugeridos: Azul (#2563eb), Índigo (#4f46e5), Blanco
```

### Hero Background (hero-background.jpg)
```
Dimensiones: 1920x1080 px (Full HD)
DPI: 72
Formato: JPG optimizado
Peso máximo: 500 KB
Calidad: 80-85%
Nota: La imagen tendrá overlay azul automático
```

### Patrón (pattern-bg.svg)
```
Dimensiones: 200x200 px
Formato: SVG
Peso máximo: 50 KB
Color: Gris claro (#e2e8f0) con transparencia
Opacidad: 10-20%
```

---

## ✅ Checklist de Implementación

### Inmediato (No requiere imágenes)
- [x] Navbar oscura profesional funcionando
- [x] Fondo con patrón de líneas sutiles
- [x] Hero con gradiente azul-índigo
- [x] Logo placeholder "CT" en gradiente
- [x] Estilos CSS profesionales aplicados

### Cuando tengas las imágenes
- [ ] Agregar `public/logo-congreso.png`
- [ ] Actualizar línea 29 en `Navbar.jsx` (opcional)
- [ ] Agregar `public/hero-background.jpg`
- [ ] (Opcional) Agregar `public/pattern-bg.svg`
- [ ] (Opcional) Actualizar línea 5 en `globals.css`

---

## 🎯 Resultado Esperado

### Sin Imágenes Personalizadas (Estado Actual):
✓ Navbar oscura con logo "CT" en gradiente  
✓ Fondo gris claro con líneas sutiles  
✓ Hero con gradiente azul-índigo  
✓ Diseño limpio y profesional  

### Con Imágenes Personalizadas:
✓ Todo lo anterior +  
✓ Tu logo institucional en navbar  
✓ Imagen de tecnología en hero con overlay  
✓ Patrón personalizado en fondo (opcional)  

---

## 📞 Notas Importantes

1. **Las imágenes son opcionales** - El diseño actual se ve profesional sin ellas
2. **No hay "placeholders feos"** - Usamos gradientes y colores elegantes
3. **Optimiza las imágenes** - Usa herramientas como TinyPNG o Squoosh
4. **Prueba en móvil** - Asegúrate que se vean bien en pantallas pequeñas
5. **Mantén consistencia** - Usa la paleta de colores del sitio (azules, índigos)

---

## 🎨 Paleta de Colores del Sitio

```css
Azul primario: #2563eb (blue-600)
Azul oscuro: #1e40af (blue-800)
Índigo: #4f46e5 (indigo-600)
Gris oscuro: #1f2937 (gray-800)
Gris medio: #6b7280 (gray-500)
Gris claro: #f3f4f6 (gray-100)
Blanco: #ffffff
```

Usa estos colores en tu logo y diseños para mantener coherencia visual.

---

**Última actualización:** 14 de Octubre, 2025
**Estado del diseño:** ✅ Profesional y listo para usar
