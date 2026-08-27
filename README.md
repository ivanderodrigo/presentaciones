# Westcon Meeting Intelligence · v1.0 Final

Aplicación estática, desplegable directamente en **GitHub Pages**, para preparar reuniones de Westcon Comstor con **partners e integradores** y generar un PowerPoint FY27 final, atractivo y diseñado para ser mostrado al partner.

## Filosofía de esta versión

**Muy simple para el usuario; muy compleja por debajo.**

El usuario no tiene que redactar una presentación ni elegir fuentes de research. La entrada mínima es:

1. partner / integrador;
2. rol: **PSM, VSM o Solution Architect**;
3. objetivo de la reunión;
4. para VSM/SA, fabricante foco; para PSM es opcional.

El resto se deduce y se investiga. Los campos adicionales existen solo para aportar información que Internet no puede conocer: facturación, pipeline, certificaciones en curso, contexto de relación, arquitectura actual, criterios de PoC, etc.

## El PowerPoint es partner-facing

La presentación final **no contiene lenguaje interno** como “cómo vender”, scoring de fabricantes, whitespace, hipótesis, research pendiente o instrucciones al comercial. Esa información solo sirve al motor para decidir qué contenido incluir, en qué orden y con qué argumentos.

La narrativa visible utiliza formulaciones como:

- objetivo y agenda;
- evolución conjunta;
- oportunidades en curso;
- casos de uso;
- por qué una solución encaja;
- diferenciación;
- evidencia de mercado;
- posicionamiento público de analistas;
- referencias y señales recientes;
- servicios Westcon relevantes;
- próximos pasos.

## Tres motores según el rol

### PSM

Gestión comercial global orientada al partner. Puede incorporar facturación por fabricante, evolución, objetivos y pipeline, pero también funciona sin esos datos. El motor detecta áreas de crecimiento, selecciona fabricantes/capacidades relevantes y compone una business review externa.

### VSM

Desarrollo de un fabricante dentro del partner. Combina relación, negocio, tier, certificaciones, programa de canal, incentivos, oportunidades y el contexto público actualizado del fabricante.

### Solution Architect

Narrativa técnica: necesidad, criterios de diseño, propuesta de solución, ventajas verificables, diferenciación, evidencia de analistas, casos, documentación técnica y PoC/PoV medible.

## Base de conocimiento FY27

La aplicación incluye como corpus semilla:

- **Westcon Comstor España FY2027** — 84 slides;
- **Westcon Datasheets Verticales FY27** — 12 slides;
- portfolio estructurado de **36 fabricantes**;
- servicios Westcon y framework BLUEPRINT;
- taxonomías de Ciberseguridad, Networking, Cloud/UC/Automatización;
- playbooks y casos para Banca y Seguros, Administración Pública, Industria/Utilities y Retail.

Las slides corporativas/datasheets se reutilizan cuando aportan valor; la información específica de reunión se genera con la misma identidad visual FY27.

## Motor de inteligencia

La versión final v1.0 trabaja con tres niveles que se complementan:

### 1. Inteligencia estructurada permanente

Cada fabricante dispone de una ficha con:

- categoría y propuesta de valor;
- ventajas extraídas del corpus FY27;
- casos de uso y señales de oportunidad;
- criterios de decisión;
- competidores/alternativas para razonamiento interno;
- mapeo a verticales;
- slides corporativas que se pueden reutilizar.

### 2. Research público programado para los 36 fabricantes

`.github/workflows/update-intelligence.yml` ejecuta diariamente `scripts/research_intelligence.py`.

El proceso usa varias rutas independientes y tolerantes a fallos:

- **GDELT DOC 2.0**;
- **Google News RSS**;
- sitemaps y páginas oficiales de fabricante;
- caché anterior cuando una fuente temporalmente falla.

Se investigan varias familias: analistas, mercado/innovación, casos de cliente, canal/certificaciones y arquitectura/documentación.

La evidencia se deduplica, puntúa por autoridad y conserva **fuente, fecha y URL**.

### 3. Research en tiempo de preparar la reunión

Al pulsar **Investigar y preparar presentación**, el navegador consulta señales recientes sobre:

- partner: estrategia, alianzas, certificaciones, adquisiciones, proyectos, inversión, contratación y relación con los vendors seleccionados;
- fabricante: analistas, noticias, innovación, casos, fuentes oficiales, relación con el partner, canal y —para SA— arquitectura/benchmark/integraciones.

Se usa caché local de 12 horas para no repetir trabajo innecesario.

## Analistas y rigor

El radar contempla, entre otros:

- Gartner;
- Forrester;
- IDC / IDC MarketScape;
- Omdia;
- GigaOm;
- ISG;
- Canalys;
- KuppingerCole.

Regla fundamental: **la aplicación no convierte “aparece en un informe” en “Leader”**. Una posición concreta solo puede mostrarse si la evidencia pública la declara explícitamente. Las URLs completas quedan disponibles en las notas del presentador.

## Verticalización

Cuando se selecciona una vertical, el motor cruza:

`vertical × caso de uso × fabricante × tecnología × evidencia × contenido FY27`

para construir slides específicas y seleccionar automáticamente los datasheets/playbooks relevantes.

## Privacidad

Los datos que introduce PSM/VSM/SA —facturación, pipeline, contexto interno, arquitectura, etc.— permanecen en `localStorage` del navegador salvo que el usuario exporte manualmente el JSON.

El repositorio solo contiene el corpus de la aplicación y **evidencia pública** obtenida por el proceso de actualización.

## Instalación en GitHub Pages

Copia el contenido de esta carpeta a la raíz del repositorio, conservando tu `.git`, y ejecuta:

```powershell
git add -A
git commit -m "Westcon Meeting Intelligence v1.0 final"
git push origin main
```

En GitHub:

**Settings → Pages → Deploy from a branch → main → /(root)**

## Primera actualización intensiva

Después del despliegue abre:

**GitHub → Actions → Update public market intelligence → Run workflow**

La ejecución rellena/refresca `data/live-intelligence.json` y `data/live-intelligence.js` para todo el portfolio. A partir de ahí el workflow vuelve a ejecutarse diariamente.

## Ejecución local

```powershell
python -m http.server 8000
```

Abrir `http://localhost:8000`.

## Estructura principal

```text
index.html
styles.css
app.js
assets/
  source-slides/
    corporate/      # 84 slides FY27
    verticals/      # 12 datasheets
  vendors/
data/
  knowledge.js/json
  vendor-intelligence.js/json
  live-intelligence.js/json
scripts/
  research_intelligence.py
.github/workflows/
  update-intelligence.yml
vendor/
  pptxgen.bundle.js
```

La aplicación no necesita Node, npm ni un servidor de aplicación para funcionar en GitHub Pages.
