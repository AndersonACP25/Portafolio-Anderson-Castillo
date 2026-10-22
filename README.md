# Portafolio profesional · Anderson Castillo

Portafolio estático de QA Automation Engineer con proyectos públicos, experiencia, habilidades y formación. HTML, CSS y JavaScript sin proceso de compilación.

## Desarrollo local

```bash
python -m http.server 8000
```

Abrir http://localhost:8000. El sitio también puede abrirse desde `index.html`.

## Contenido y mantenimiento

- `index.html`: estructura semántica y texto de respaldo en inglés, legible sin JavaScript.
- `css/variables.css`: colores y tokens del diseño.
- `css/styles.css`: componentes y adaptación a móvil.
- `js/translations.js`: textos EN/ES. Los títulos oficiales de cursos y nombres de tecnologías conservan su nombre original.
- `js/language-manager.js`: idioma persistido cuando el almacenamiento está disponible y navegación móvil con cierre por Escape.
- `assets/cv/cv-anderson-castillo.pdf`: CV descargable; respetar mayúsculas y minúsculas de la ruta.

### Fuentes de los proyectos

Las descripciones se basan en los README públicos de [qaTestGE](https://github.com/AndersonACP25/qaTestGE) y [CASHFAST](https://github.com/AndersonACP25/ProyectoFinalRemesa-CASHFAST). Las portadas son composiciones tipográficas, no capturas del producto. qaTestGE enlaza su documentación de pruebas; no se afirma que disponga de integración IA funcional o demo desplegada.

### Información editorial pendiente

Se conservan los datos profesionales del portafolio original: 400+ casos automatizados, 50% de reducción de regresión, experiencia desde mayo de 2022 y graduación estimada en 2028. Antes de añadir más detalle, confirmar con Anderson el período, alcance y método de cálculo de las métricas. No se inventan resultados de proyectos ni datos de clientes.

Los cursos se presentan como formación y credenciales. Añadir enlaces individuales de verificación cuando el propietario los proporcione. El título «Responsive Web Design» corrige la errata original; confirmar que coincide con la credencial. No se incorporan reportes corporativos, capturas privadas ni un repositorio público de automatización inexistente.

## Verificación de cambios

- Probar en 320, 375, 768, 1024 y 1440 px, sin desplazamiento horizontal.
- Abrir/cerrar el menú con teclado; Escape devuelve el foco al botón.
- Navegar a una sección desde el menú y comprobar el cierre y la posición del título.
- Cambiar EN/ES, recargar y comprobar persistencia y atributo `html[lang]`.
- Comprobar que los textos siguen disponibles si se desactiva JavaScript.
- Descargar CV y revisar los enlaces a proyectos.
- Revisar foco visible y reducción de movimiento.

## Publicación

GitHub Pages usa la rama configurada en el repositorio. Los cambios en una rama de mejora deben revisarse mediante Pull Request antes de integrarse en `master`.

[Ver portafolio](https://andersonacp25.github.io/Portafolio-Anderson-Castillo/)
