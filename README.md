# Westcon Meeting Intelligence · v0.1.1

Primera versión estática para preparar reuniones de Westcon Comstor con **partners / integradores** desde distintos perfiles internos:

- **PSM (perfil comercial orientado al partner)**: negocio global del partner, facturación por fabricante, evolución, objetivos, pipeline, whitespace y plan de crecimiento.
- **VSM (perfil comercial orientado al fabricante)**: relación fabricante–Westcon–partner, tier, certificaciones, plan de canal, incentivos/MDF, pipeline y bloqueos.
- **Solution Architect (perfil técnico)**: caso de uso, arquitectura, requisitos, alternativas, diferenciadores, analistas y criterios de PoC/PoV.

No existe un perfil separado **“Comercial / BDM”**: la función comercial se representa como **PSM** cuando la conversación está orientada al partner y como **VSM** cuando está orientada al desarrollo de un fabricante dentro de ese partner.

## Qué funciona en esta versión

- Formulario adaptativo por rol y roles secundarios.
- Portfolio FY27 sembrado desde las presentaciones corporativas facilitadas.
- Servicios Westcon / BLUEPRINT como base de propuesta de valor.
- Tablas de facturación y oportunidades con lectura automática.
- Definición de áreas de investigación y generación de queries de research.
- Blueprint narrativo automático según el perfil.
- PowerPoint `.pptx` editable generado en el navegador con PptxGenJS.
- Briefing HTML, impresión / Guardar como PDF.
- Guardado en `localStorage` por navegador.
- Importación y exportación de reuniones en JSON.
- Cero backend y cero proceso de build para poder desplegarlo directamente en GitHub Pages.

## Publicarlo en GitHub Pages

1. Crea un repositorio, por ejemplo `westcon-meeting-intelligence`.
2. Sube **todo el contenido de esta carpeta a la raíz del repositorio**.
3. En GitHub abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona `main` y `/ (root)` y guarda.
6. GitHub publicará la URL de Pages en unos minutos.

No hay que ejecutar `npm install`, compilar ni construir nada.

## Nota importante sobre PowerPoint

La aplicación es estática y lleva **PptxGenJS incluido localmente** en `vendor/`, por lo que la generación de `.pptx` no depende de un CDN ni de un proceso de build.

## Datos y privacidad de esta v0.1.1

Los datos introducidos se guardan **solo en el `localStorage` del navegador** salvo que el usuario descargue el JSON. No existe servidor, base de datos ni autenticación. Por tanto:

- no utilizar esta v0.1 para información comercial sensible en equipos compartidos;
- borrar el almacenamiento del navegador si se trabaja en un equipo no personal;
- para uso corporativo multiusuario real, la siguiente fase debe incorporar autenticación y almacenamiento autorizado.

## Research automático

GitHub Pages no puede guardar secretos ni ejecutar búsquedas de Internet del lado servidor. Esta v0.1.1 deja preparado el **modelo de research**, las áreas a investigar, reglas de confianza y queries sugeridas. La siguiente versión debería añadir una de estas capas:

1. GitHub Actions programado que actualice `data/research/*.json` desde fuentes públicas; o
2. servicio/API corporativo de research con autenticación; o
3. integración con una base de conocimiento/RAG autorizada.

El frontend está diseñado para consumir esos resultados sin cambiar el flujo de usuario.

## Fuentes semilla

- `Westcon_Comstor_Espana_FY27_completa.pptx`
- `Westcon_Datasheets_Verticales_FY27.pptx`

Se han utilizado para sembrar portfolio, servicios, taxonomías, BLUEPRINT y lógica de contenido. La reutilización física de slides existentes dentro del nuevo PPTX queda para la siguiente iteración.
