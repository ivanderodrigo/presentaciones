# Westcon Meeting Intelligence · v2.0

Aplicación estática para **GitHub Pages** que prepara reuniones con partners/integradores y genera un PowerPoint FY27 final, pensado para enseñarlo directamente al partner.

## Idea central

**Máxima sencillez por fuera; máxima inteligencia por dentro.**

La entrada mínima es:

1. **partner / integrador**;
2. **rol**: PSM, VSM o Solution Architect;
3. **objetivo de la reunión**;
4. VSM/SA: **fabricante foco**. En PSM puede quedar vacío y el motor propone el foco a partir del contexto.

El tipo de reunión se adapta automáticamente al rol mientras el usuario no lo cambie. Fabricantes adicionales, vertical, tecnologías, servicios, profundidad, research y datos privados son opcionales.

## Qué cambia en v2

### Partner Intelligence

La aplicación construye una ficha viva del partner a partir de señales públicas y memoria local de reuniones:

- portfolio y fabricantes visibles;
- especialización tecnológica;
- verticales y referencias;
- certificaciones y alianzas;
- estrategia, adquisiciones, expansión y noticias;
- talento/ofertas como señal de inversión;
- proyectos, contratos y casos públicos;
- continuidad de reuniones anteriores.

Los resultados de cada reunión pueden registrarse en segundos. La siguiente reunión recupera acuerdos, objeciones y próximos pasos.

Existe además un workflow manual **Research partner dossier** que permite enriquecer y versionar en GitHub la inteligencia pública de un partner concreto.

### Vendor Intelligence · 36/36 fabricantes

Cada fabricante dispone de una ficha estructurada con:

- propuesta de valor y categoría;
- ventajas comerciales/técnicas aprobadas a partir del corpus FY27;
- criterios de decisión;
- señales de compra;
- contexto competitivo interno;
- temas de prueba / PoC;
- encaje por vertical;
- plan de investigación específico;
- mapeo a las slides corporativas FY27 que se pueden reutilizar.

El research público diario profundiza en:

- Gartner, Forrester, IDC/MarketScape, Omdia, GigaOm, ISG, Canalys y KuppingerCole;
- casos públicos y referencias;
- lanzamientos, adquisiciones, estrategia y momentum;
- market share/adopción cuando hay evidencia pública;
- programa de canal, certificaciones, especializaciones e incentivos públicos;
- arquitectura, integración, interoperabilidad, benchmarks y reference designs;
- competencia, alternativas, migraciones y diferenciación;
- resiliencia, seguridad, vulnerabilidades, incidentes y confianza.

La evidencia conserva **fuente, fecha, URL, clase, autoridad y confianza**. Una posición de analista solo se presenta cuando la fuente pública la declara explícitamente.

### Presentation Director

El usuario no elige una plantilla. El director decide automáticamente:

- profundidad y número objetivo de slides según duración;
- cuánto contexto Westcon necesita ese partner;
- qué fabricantes merecen prioridad;
- qué slides del corpus FY27 reutilizar;
- qué contenido nuevo generar;
- qué vertical/casos de uso encajan;
- qué evidencia de mercado merece aparecer;
- qué servicios Westcon refuerzan el siguiente paso;
- qué dejar fuera para no convertir la reunión en un catálogo.

La biblioteca de **96 slides fuente** está indexada semánticamente: 84 corporativas + 12 datasheets verticales. Los playbooks internos y las slides con instrucciones para comerciales pueden alimentar el razonamiento, pero **no se insertan en la presentación partner-facing**.

## Salida partner-facing

El PowerPoint final no muestra “cómo vender”, scoring, whitespace, hipótesis, cola de búsquedas ni instrucciones internas. Puede mostrar, según la reunión:

- objetivo y agenda;
- contexto relevante del partner;
- evolución conjunta y pipeline cuando el PSM aporta datos;
- próximos hitos de desarrollo con el fabricante;
- necesidad, arquitectura y criterios de diseño;
- casos de uso verticales;
- diferenciación y criterios de decisión;
- posicionamiento/evidencia pública de analistas;
- noticias y señales recientes relevantes;
- contenido corporativo FY27 original;
- servicios Westcon;
- próximos pasos.

El **briefing interno** sí conserva razones de priorización, fuentes, scoring y preguntas de discovery.

## PSM

Funciona con partner + objetivo. Opcionalmente permite introducir:

- contexto de relación;
- facturación FY25/FY26/FY27 YTD;
- objetivos y pipeline;
- oportunidades;
- compromisos previos.

Para reducir trabajo se puede **importar un CSV de negocio** exportado desde Excel. La propia aplicación descarga una plantilla con los encabezados esperados.

## VSM

Solo necesita partner + fabricante + objetivo. Los datos de tier, certificaciones, objetivos, incentivos, pipeline y plan de canal son opcionales y enriquecen la narrativa.

## Solution Architect

Solo necesita partner + fabricante + objetivo/caso de uso. El resto del contexto técnico es opcional. La aplicación prepara diferenciación, criterios, evidencia externa, diseño narrativo y PoC/PoV.

## Base FY27 incluida

- 84 slides de **Westcon Comstor España FY2027**;
- 12 **Datasheets Verticales FY27**;
- 36 fabricantes estructurados;
- Ciberseguridad, Networking, Cloud/UC/Automatización;
- servicios Westcon y BLUEPRINT;
- verticales Banca y Seguros, Administración Pública, Industria/Utilities y Retail.

## Privacidad

Facturación, pipeline, notas internas, arquitectura y resultados de reunión se guardan en `localStorage` del navegador, salvo exportación manual del usuario.

Los workflows de GitHub solo escriben **evidencia pública** de fabricantes y partners.

## Actualizaciones automáticas

### Inteligencia de fabricantes

**Actions → Update public market intelligence → Run workflow**

Después se ejecuta diariamente. Genera/refresca:

- `data/live-intelligence.json`
- `data/live-intelligence.js`

### Dossier de un partner

**Actions → Research partner dossier → Run workflow**

Introduce partner, país y horizonte. Genera/refresca:

- `data/partner-intelligence.json`
- `data/partner-intelligence.js`

## Instalación / actualización en GitHub Pages

Si ya tienes el repositorio, conserva únicamente `.git`, sustituye el resto por el contenido de esta versión y ejecuta:

```powershell
git add -A
git commit -m "Westcon Meeting Intelligence v2.0"
git push origin main
```

GitHub Pages:

**Settings → Pages → Deploy from a branch → main → /(root)**

## Ejecución local

```powershell
python -m http.server 8000
```

Abrir `http://localhost:8000`.

## Calidad

`python scripts/quality_gate.py` valida, entre otras cosas:

- 36/36 fabricantes;
- 96/96 slides indexadas;
- 84 slides corporativas y 12 verticales presentes;
- motores Partner/Vendor/Presentation Director;
- workflows de research;
- ausencia de lenguaje interno prohibido en el generador partner-facing;
- exclusión de playbooks/mensajes internos del PowerPoint externo.
