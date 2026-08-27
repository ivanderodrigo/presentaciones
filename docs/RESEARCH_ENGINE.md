# Research Engine · v2.0

## Objetivo

Crear mucha profundidad de inteligencia sin trasladar trabajo al PSM, VSM o SA.

## Dos ritmos

### 1. Background diario · 36 fabricantes

`scripts/research_intelligence.py` utiliza rutas gratuitas y tolerantes a fallos:

- GDELT DOC 2.0;
- Google News RSS;
- sitemaps/páginas oficiales del fabricante;
- caché previa si una ruta falla.

Familias de búsqueda:

- analistas;
- casos públicos;
- mercado/estrategia/momentum;
- market share/adopción;
- canal/certificaciones/incentivos;
- tecnología/arquitectura/benchmarks;
- competencia/migración/diferenciación;
- resiliencia/seguridad/incidentes/confianza.

El motor busca diversidad de fuentes y limita duplicados de la misma historia.

### 2. Runtime por reunión

Se profundiza solo en el partner y los vendors que el director considera relevantes:

- estrategia y alianzas del partner;
- portfolio, skills, certificaciones y verticales;
- proyectos, clientes, contratos y noticias;
- contratación como señal de inversión;
- relación pública partner-vendor;
- analistas y posicionamiento;
- referencias y casos;
- competencia;
- documentación técnica e integraciones;
- programa de canal para VSM;
- arquitectura/benchmark/PoC para SA.

## Partner dossier compartido

`scripts/research_partner.py` permite lanzar un research más profundo de un partner concreto desde GitHub Actions. Consulta el portfolio completo de Westcon en lotes para evitar consultas excesivamente grandes.

## Autoridad y confianza

Prioridad orientativa:

1. analista directo / publisher de analista;
2. fabricante oficial;
3. medio tecnológico especializado;
4. discovery general pendiente de triangulación.

Se conserva:

- título;
- publisher;
- fecha;
- URL;
- clase de fuente;
- score de autoridad;
- confianza;
- flags de riesgo;
- si existe o no una declaración explícita de posición de analista.

## Regla de analistas

Aparecer en un Magic Quadrant, Wave o MarketScape no significa ser Leader. La aplicación solo muestra una posición concreta si la evidencia pública contiene una afirmación explícita susceptible de ser citada.

## Tolerancia a fallos

- las consultas son independientes;
- un timeout no cancela el resto;
- se deduplica antes de persistir;
- la caché anterior se conserva cuando no hay señal nueva;
- el quality gate avisa sobre cobertura sin impedir el despliegue.
