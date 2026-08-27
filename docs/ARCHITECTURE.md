# Arquitectura de la v0.1.1 y evolución prevista

## Objetivo de la v0.1.1

Validar que la aplicación **recoge la información correcta para cada perfil** antes de añadir una capa de research masivo y generación avanzada.

## Modelo de perfiles

- **PSM** = función comercial orientada al **partner** y a la relación global de cuenta.
- **VSM** = función comercial orientada al **fabricante** y a su desarrollo dentro del partner.
- **Solution Architect** = función **técnica**, centrada en arquitectura, diferenciación, competencia y PoC/PoV.

La aplicación no mantiene un cuarto perfil “Comercial/BDM”; esa necesidad queda absorbida por PSM o VSM según el eje de la reunión.

## Arquitectura actual

```text
GitHub Pages
  ├─ index.html / styles.css / app.js
  ├─ data/knowledge.js         -> semilla corporativa FY27
  ├─ assets/                   -> identidad visual y logos
  ├─ vendor/pptxgen.bundle.js  -> generación PPTX en navegador
  └─ localStorage             -> reuniones guardadas en cada navegador
```

No hay backend, build, base de datos ni secretos.

## Modelo de reunión

Una reunión contiene:

- contexto general del partner;
- rol principal y roles de apoyo;
- fabricantes, tecnologías, vertical y servicios;
- datos específicos del rol;
- áreas que debe investigar el motor de research;
- preferencias de salida.

El JSON exportado es el contrato inicial entre frontend y futuras capas de inteligencia.

## Evolución recomendada

```text
Documentos corporativos ─┐
Datos internos / CRM ────┼─> Knowledge / Evidence Layer
Research público ────────┘              │
                                        v
                                Meeting Reasoning Engine
                                        │
                          ┌─────────────┼─────────────┐
                          v             v             v
                        PPTX         Briefing       Notes
```

### 1. Research Layer

- jobs programados en GitHub Actions o servicio corporativo;
- búsqueda robusta por partner, vendor, certificaciones y analistas;
- caché, deduplicación, reintentos y tolerancia a fallos;
- fuente, URL, fecha de publicación, fecha de consulta, confianza;
- separación entre hecho, inferencia e hipótesis comercial.

### 2. Knowledge Layer

- indexación de presentaciones y documentos;
- biblioteca de slides con metadatos y embeddings;
- grafo `partner → vendor → tecnología → caso de uso → servicio → evidencia`;
- control de vigencia y fuente.

### 3. Datos internos

Para PSM/VSM la fuente ideal será CRM/BI o un fichero controlado, no almacenamiento público en Pages. El frontend ya modela:

- facturación por fabricante y FY;
- target;
- pipeline;
- tier y certificaciones;
- incentivos / MDF;
- acciones y bloqueos.

### 4. Composer

La siguiente iteración debería clasificar cada slide como:

- `REUSE`: reutilizar slide corporativa existente;
- `ADAPT`: reutilizar estructura y adaptar contenido;
- `GENERATE`: crear una slide nueva;
- `INSERT`: reservar/incluir slides oficiales del fabricante.

## Seguridad

GitHub Pages sirve archivos estáticos. Cualquier dato incluido físicamente en el repositorio puede ser descargado por quien tenga acceso al sitio. La v0.1.1 mantiene los datos de reunión en el navegador para evitar publicar información de negocio por error.
