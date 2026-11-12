# Westcon Presentation Builder · v3

Aplicación estática para GitHub Pages orientada a **crear presentaciones ad-hoc para partners e integradores**, no a gestionar reuniones.

## Principio

**La presentación original FY27 es la biblioteca. La inteligencia añade contexto; el usuario mantiene el control final del deck.**

La experiencia se reduce a:

1. partner (opcional);
2. perfil PSM / VSM / Solution Architect (opcional, solo para orientar la propuesta);
3. objetivo;
4. fabricantes y vertical, cuando apliquen;
5. botón **Proponer deck**.

Después el usuario puede **añadir, quitar, duplicar y reordenar** cualquier slide antes de generar el PowerPoint.

## Biblioteca incluida

- 84 slides corporativas de Westcon Comstor España FY2027;
- 12 verticales estructuradas (4 sectores × 3 áreas) adaptadas a 16:9;
- 36 fabricantes con Vendor Intelligence;
- evidencia pública actualizable mediante GitHub Actions;
- servicios Westcon FY27.

## Nuevas slides que puede generar

- portada personalizada;
- objetivo / agenda;
- contexto público del partner;
- caso de uso verticalizado;
- diferenciación de fabricante;
- analistas y señales de mercado;
- siguientes pasos;
- slide libre.

## Inteligencia invisible

Los workflows de research siguen actualizando `data/live-intelligence.*` y `data/partner-intelligence.*`. El constructor utiliza esas evidencias para generar contenido, pero no muestra scoring, whitespace, colas de investigación ni lenguaje interno en el deck final.

## ChatGPT + GitHub

El repositorio `ivanderodrigo/presentaciones` está conectado a ChatGPT con acceso directo de lectura y escritura. `CHATGPT.md` conserva el contexto del proyecto para futuras iteraciones.

Las nuevas versiones pueden prepararse en una rama, validarse y fusionarse a `main` desde ChatGPT, sin necesidad de sustituir archivos manualmente en VS Code.

## Despliegue

GitHub Pages publica desde `main` → `/(root)`.

Si alguna vez se trabaja en local, el flujo de respaldo es:

```powershell
git pull --rebase origin main
git add -A
git commit -m "Actualización Presentation Builder"
git push origin main
```

## Research

- **Update public market intelligence**: refresca evidencia de fabricantes.
- **Research partner dossier**: crea/actualiza dossier público de un partner.

## Calidad

```bash
python scripts/quality_gate.py
```

La validación comprueba 36 fabricantes, 96 slides indexadas, 84 assets corporativos, 12 verticales y los componentes básicos del Presentation Builder.
