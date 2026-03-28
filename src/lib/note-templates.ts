/** Plantillas HTML insertables en el editor de notas. */
export const NOTE_HTML_TEMPLATES = [
  {
    id: "class",
    label: "Clase",
    html: "<h2>Tema de hoy</h2><p></p><h3>Ideas clave</h3><ul><li></li></ul><h3>Preguntas / dudas</h3><p></p>",
  },
  {
    id: "meeting",
    label: "Reunión",
    html: "<h2>Reunión</h2><p><strong>Fecha:</strong> </p><h3>Agenda</h3><ul><li></li></ul><h3>Acuerdos</h3><ul><li></li></ul><h3>Próximos pasos</h3><p></p>",
  },
  {
    id: "reading",
    label: "Lectura",
    html: "<h2>Título / libro</h2><p></p><h3>Resumen</h3><p></p><h3>Citas</h3><blockquote><p></p></blockquote><h3>Reflexión</h3><p></p>",
  },
] as const;
