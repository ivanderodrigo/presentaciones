# Westcon Presentation Builder · v5.4

Constructor visual de presentaciones ad-hoc para Westcon Comstor España FY27.

## Principio

**Buscar → añadir → ordenar → generar.**

La aplicación no es un gestor de reuniones y no obliga a seleccionar rol, perfil ni configuración de IA.

## Interfaz

- buscador único por fabricante, tecnología, servicio o vertical;
- filtros por Corporativo, Ciberseguridad, Networking, Cloud/UC/Automatización, Servicios, Verticales y Fabricantes;
- bloques temáticos que añaden varias slides con un clic;
- biblioteca visual con miniaturas;
- preview grande al hacer clic;
- deck final con drag & drop, subir/bajar, duplicar y quitar;
- portada personalizada y slide de texto opcionales.

## Contenido

- 84 slides corporativas FY27 conservadas como fuente;
- 12 datasheets verticales originales conservados como conocimiento;
- 37 fabricantes activos en la aplicación;
- Juniper Networks retirado del portfolio visible;
- Cloudflare y Sonar (SonarQube) añadidos como slides curadas con la misma gramática visual de las fichas de fabricante;
- 9 verticales × 3 áreas = 27 slides verticales horizontales:
  - Banca y seguros
  - Administración pública
  - Industria y utilities
  - Retail
  - Sanidad
  - Educación
  - Transporte y logística
  - Hostelería y turismo
  - Software y servicios digitales

## Slides nuevas\n\nCloudflare y Sonar utilizan sus logos oficiales adjuntos y mantienen el formato de ficha de fabricante FY27.

Las nuevas fichas de fabricante reproducen el patrón visual del deck FY27:
- bloque de categoría;
- logo/nombre;
- tagline;
- oportunidad para el socio;
- ¿Qué aporta?;
- ventajas clave.

Las nuevas slides verticales utilizan el lenguaje visual de los playbooks sectoriales FY27:
- fondo navy;
- color de área;
- señales de oportunidad;
- reto;
- cuatro casos de uso;
- soluciones asociadas;
- impacto esperado;
- cómo empezar;
- siguiente paso.

No se generan automáticamente slides genéricas de “IA”, “mercado” o “diferenciación”.

## Research

El research periódico se mantiene como capa de conocimiento. Cloudflare y Sonar se incorporan al motor y Juniper deja de investigarse como fabricante activo.

## Calidad

Cada Pull Request y cada push a main valida:

    node --check builder.js
    python scripts/quality_gate.py
    python -m py_compile scripts/research_intelligence.py scripts/research_partner.py

## GitHub Pages

La aplicación se publica desde main y sigue siendo completamente estática.
\n\n## Verticales ricos\n\nCada combinación vertical/área genera 3 slides editables: contexto/reto/impacto, casos de uso + fabricantes, y activación/Westcon/siguiente paso. Un vertical completo añade 9 slides.\n\n## Bloques completos\n\nCiberseguridad, Networking y Cloud/UC/Automatización añaden sección + taxonomía + todas las fichas de fabricante asociadas.\n

## Ajustes v5.2

- Cloudflare y Sonar (SonarQube) quedan exclusivamente en Ciberseguridad.
- Sus fichas replican la estructura FY27 de fabricante: categoría, logo, tagline, 5 líneas de oportunidad para el socio, propuesta de valor y 4 ventajas clave.
- En Ciberseguridad las miniaturas de fabricantes se ordenan alfabéticamente.
- Los verticales vuelven a una única slide rica por sector/área, inspirada directamente en los playbooks sectoriales FY27 y alimentada por el contenido de los datasheets: señales, reto, 4 casos de uso, fabricantes con logos, cómo empezar, impacto y siguiente paso.
- Se añade favicon.ico real en la raíz más favicon.svg versionado para mejorar la identificación de la pestaña del navegador.


## Ajustes v5.3

- Cloudflare y Sonar clonan la geometría real de una ficha FY27: Corbel, mismos cuadros, mismas proporciones, mismo bloque fijo de Oportunidad para el socio y cuatro ventajas.
- La slide general de portfolio se parchea visualmente para añadir Cloudflare y Sonar en los huecos Cyber y ocultar Juniper sin rediseñar la página.
- La taxonomía Cyber incorpora Cloudflare y Sonar; la taxonomía Networking elimina las referencias restantes a Juniper.
- La biblioteca sigue la narrativa del PPT original: portada/introducción → Cyber + taxonomía + fabricantes alfabéticos + verticales → Networking + taxonomía + fabricantes + verticales → Cloud/UC/Automatización + fabricantes + verticales → servicios/cierre.
- Cada vertical es una única slide rica con la geometría del playbook sectorial FY27: señales, 4 casos, logos, quick wins, por qué ganamos y siguiente paso.


## Ajustes v5.4

- Cloudflare y Sonar mantienen la geometría exacta de las fichas FY27, pero con contenido reescrito para respetar estrictamente el espacio de cada cuadro.
- Portfolio de fabricantes reconstruido de forma nativa: sin overlays, sin Juniper, sin huecos visibles y con Cloudflare/Sonar integrados naturalmente.
- Taxonomías tecnológicas reconstruidas desde un mapa maestro (data/taxonomy.*). Todos los fabricantes activos quedan representados y pueden aparecer en varias categorías cuando su portfolio lo requiere.
- Las taxonomías no incluyen categorías de servicios Westcon.
- Los verticales mantienen una única slide rica por sector/área, con el grid del playbook FY27, títulos adaptativos para sectores largos y un máximo de dos logos grandes por caso de uso.
- La biblioteca conserva la narrativa del deck original y coloca los verticales al cierre de cada bloque tecnológico.
