# Westcon Presentation Studio · v4

Aplicación estática para GitHub Pages orientada a **construir presentaciones ad-hoc** a partir del corpus FY27 de Westcon Comstor.

## Principio de producto

**Partir de la presentación original y añadir solo lo que aporta valor.**

La aplicación ya no funciona como gestor de reuniones. El usuario puede empezar vacío, reutilizar slides FY27, añadir bloques completos y dejar que el motor proponga una narrativa editable.

## Qué aporta v4

### Biblioteca visual
- miniaturas grandes de las slides FY27;
- búsqueda por fabricante, tecnología o servicio;
- filtros Corporativo / Fabricantes / Servicios / Verticales / IA útil;
- previsualización a pantalla completa;
- añadir, quitar, duplicar, arrastrar y reordenar.

### Bloques rápidos
- base Westcon;
- bloque completo por fabricante;
- bloque vertical;
- servicios adaptados al perfil;
- cierre.

### Rol explicado, no impuesto
El rol es opcional y únicamente modifica la propuesta automática:
- **PSM**: conversación ejecutiva, valor conjunto, portfolio, verticales, servicios y crecimiento;
- **VSM**: fabricante, diferenciación, evidencia y activación de canal;
- **SA**: caso de uso, criterios, PoV/PoC y preventa.

La interfaz muestra explícitamente qué cambiará al elegir cada perfil.

### Vertical explicado, no impuesto
La vertical es opcional. Si se selecciona, activa contenido FY27 de:
- Banca y seguros;
- Administración pública;
- Industria y utilities;
- Retail.

Los casos de uso se recomponen en 16:9 y se priorizan según las áreas de los fabricantes seleccionados.

### IA con umbral de profundidad
La aplicación ya no añade automáticamente slides vacías de “diferenciación” o “mercado”.

Cada fabricante puede generar:
1. **Historia de valor**: propuesta, por qué ahora, diferenciales, criterios de decisión y resultado buscado.
2. **Prueba de valor**: PoV/PoC, qué medir, evidencia FY27 y validación externa.
3. **Señales de mercado**: solo aparece cuando existen al menos tres evidencias públicas suficientemente sólidas.

Los motores usan data/vendor-intelligence.* y data/live-intelligence.*. Las afirmaciones externas se muestran únicamente con fuente atribuible.

## Corpus

- 84 slides corporativas FY27;
- 12 datasheets verticales;
- 36 fabricantes;
- 12 modelos verticales 16:9;
- research periódico de fabricantes y partners.

## Presentación generada

Las slides originales se reutilizan como imagen completa para conservar fidelidad visual. Las slides nuevas se construyen como objetos PowerPoint editables y utilizan un sistema visual consistente con Westcon: tipografía amplia, más espacio en blanco, jerarquía clara y menos cajas de texto pequeñas.

## Desarrollo

La calidad se valida en cada Pull Request y en main:

    node --check builder.js
    python scripts/quality_gate.py
    python -m py_compile scripts/research_intelligence.py scripts/research_partner.py

## GitHub Pages

La aplicación sigue siendo 100% estática y compatible con Pages desde main.
