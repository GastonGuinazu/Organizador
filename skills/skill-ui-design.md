# Skill: UI / UX (family-friendly)

## Principios

- Lenguaje claro, sin jerga técnica en la interfaz.
- Contraste legible, tamaños de toque generosos en móvil (mín. ~44px donde aplique).
- Estados vacíos amables con una acción clara (“Crear tu primera actividad”).
- Feedback inmediato: loading en botones, mensajes de error breves y útiles.

## Accesibilidad

- Etiquetas en inputs; botones con texto o `aria-label`.
- Foco visible; orden de tab lógico.

## Identidad visual

- Paleta calmada: fondo claro, acento teal/azul verdoso, texto slate.
- Tipografía: sistema + variables Geist ya en layout; mantener jerarquía H1 > H2 > cuerpo.
- Bordes redondeados consistentes (`rounded-xl` en tarjetas).

## Componentes

- `Button`, `Input`, `Card` en `src/components/ui/` para no duplicar estilos.
