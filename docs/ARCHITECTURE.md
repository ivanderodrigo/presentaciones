# Westcon Meeting Intelligence · arquitectura v2.0

## Principio

La interfaz pide lo mínimo. La complejidad vive en tres motores: **Partner Intelligence**, **Vendor Intelligence** y **Presentation Director**.

## Flujo

1. **Input mínimo** — partner, rol y objetivo; VSM/SA añaden fabricante foco.
2. **Autoconfiguración** — el rol propone tipo de reunión; profundidad, vertical, servicios y contenido pueden quedar en automático.
3. **Contexto privado opcional** — facturación/pipeline, certificaciones, arquitectura, compromisos.
4. **Runtime research** — partner + vendors relevantes + objetivo/caso de uso.
5. **Knowledge fusion** — corpus FY27 + fichas vendor + verticales + evidencia pública + memoria de relación.
6. **Presentation Director** — decide historia, prioridad, longitud, balance reutilizar/adaptar/generar y qué eliminar.
7. **Composition** — slides FY27 existentes + layouts nuevos con identidad FY27.
8. **Quality boundary** — research, scoring e hipótesis permanecen internos; el PowerPoint es partner-facing.
9. **Feedback loop** — resultado de reunión alimenta la memoria local del partner.

## Partner Intelligence

Combina:

- `data/partner-intelligence.*`: dossiers públicos compartidos y versionables;
- research runtime del navegador;
- `localStorage`: memoria privada de reuniones;
- señales tecnológicas, verticales y menciones de vendors.

La memoria permite continuidad sin publicar datos comerciales en GitHub.

## Vendor Intelligence

`data/vendor-intelligence.*` contiene el modelo estructurado estable de 36 fabricantes.

`data/live-intelligence.*` contiene evidencia pública cambiante descubierta por el workflow diario.

Cada evidencia conserva metadatos y se clasifica como analista, caso, competencia, canal, técnica, mercado, market-share o trust/risk.

## Slide Intelligence

`data/slide-index.*` indexa 96 piezas visuales con metadatos de rol, vendor, área, vertical, tipo y tags.

El selector semántico puntúa esas piezas frente al objetivo y excluye las slides internas con instrucciones al comercial.

## Presentation Director

Decide:

- short / standard / deep;
- presupuesto de slides;
- introducción Westcon full / compact / none;
- vendors prioritarios;
- vertical explícita o inferida;
- partner snapshot;
- evidence blocks;
- servicios relevantes;
- reutilización de contenido FY27;
- siguiente paso.

Su scoring solo aparece en briefing interno.

## Seguridad y privacidad

- datos privados: navegador/localStorage;
- GitHub: corpus y evidencia pública;
- ninguna credencial o API key requerida;
- fail-soft: una fuente caída no detiene la generación;
- evidence-first: no se promociona una inferencia a hecho.
