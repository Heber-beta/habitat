// Datos fijos de la app: mascotas, áreas, emociones del rescate y textos.

// fx, fy: dónde pisa la mascota en la ilustración de su hogar (en píxeles de la
// imagen original de 338 de ancho). h: alto de la mascota en una pantalla de 390.
export const PETS = {
  zorro: { label: 'Zorro', name: 'Miso', h: 150, fx: 120, fy: 400, desc: 'Astuto y juguetón. Encuentra atajos para empezar y celebra con saltos.' },
  gato: { label: 'Gato', name: 'Nube', h: 104, fx: 180, fy: 330, desc: 'Tranquilo y curioso. Se acomoda en tus apuntes y ronronea en el modo enfoque.' },
  perro: { label: 'Perro', name: 'Toby', h: 145, fx: 150, fy: 470, desc: 'Leal y con energía. Mueve la cola cada vez que cumples y te espera en la puerta.' },
  ballena: { label: 'Ballena', name: 'Azul', h: 110, fx: 170, fy: 260, desc: 'Grande y serena. Flota a tu lado y su mar se llena de vida con cada hábito.' },
  axolote: { label: 'Axolote', name: 'Rosi', h: 72, fx: 115, fy: 430, desc: 'Siempre sonriente y experto en regenerarse: perfecto para volver después de un mal día.' },
  dinosaurio: { label: 'Dinosaurio', name: 'Rex', h: 150, fx: 175, fy: 480, desc: 'Fuerte y un poco torpe. Ideal para entrenar: levanta pesas contigo.' },
  panda: { label: 'Panda rojo', name: 'Momo', h: 150, fx: 180, fy: 390, desc: 'Calmado y comilón. Te recuerda que la versión mínima también cuenta.' },
  capibara: { label: 'Capibara', name: 'Yuzu', h: 135, fx: 165, fy: 420, desc: 'El más relajado. Baja la ansiedad antes de partir y se lleva bien con todos.' },
  buho: { label: 'Búho', name: 'Sabio', h: 112, fx: 200, fy: 400, desc: 'Sabio y nocturno. Te acompaña a estudiar y a cerrar tus proyectos de noche.' },
  conejo: { label: 'Conejo', name: 'Copo', h: 135, fx: 110, fy: 430, desc: 'Rápido y tierno. Perfecto para arrancar con pasos chiquititos.' }
};
export const PET_ORDER = ['zorro', 'gato', 'perro', 'ballena', 'axolote', 'dinosaurio', 'panda', 'capibara', 'buho', 'conejo'];

export const AREAS = {
  estudio: { label: 'Estudio', scene: 'estudio', color: '#5B9BD0', soft: '#DCEBF6', ink: '#2C5E86' },
  entreno: { label: 'Ejercicio', scene: 'entreno', color: '#7FB069', soft: '#E3F0D8', ink: '#2F6B4F' },
  proyectos: { label: 'Proyectos', scene: 'proyectos', color: '#F6C453', soft: '#FBEBC4', ink: '#7A5A0E' },
  hogar: { label: 'Hogar y bienestar', scene: 'casa', color: '#C9A0DC', soft: '#F1E6F7', ink: '#6B3F86' }
};

export const LEVELS = {
  min: { label: 'Mínima', hint: 'Lo más chico que cuenta', color: '#F6C453' },
  normal: { label: 'Normal', hint: 'Lo que planeaste', color: '#7FB069' },
  epic: { label: 'Épica', hint: 'Fuiste más allá (+1 comodín)', color: '#2F6B4F' }
};

export const STAGES = [
  { from: 0, label: 'Cría', scale: 0.82 },
  { from: 21, label: 'Joven', scale: 0.92 },
  { from: 45, label: 'Adulto', scale: 1 },
  { from: 66, label: 'Forma especial', scale: 1.05 }
];

export const FEELINGS = [
  { id: 'aburrido', label: 'Aburrimiento', color: '#8EC5E8', title: 'Hagámoslo menos aburrido', tip: 'Combina la tarea con algo que te guste: tu playlist favorita o algo rico, solo mientras trabajas. Así tu cerebro asocia la tarea con algo bueno.' },
  { id: 'motivacion', label: 'Sin motivación', color: '#F6C453', title: 'No necesitas ganas para partir', tip: 'La motivación casi siempre llega después de empezar, no antes. No te comprometas con toda la tarea: solo con 5 minutos.' },
  { id: 'empezar', label: 'No sé por dónde empezar', color: '#7FB069', title: 'Busquemos el primer paso', tip: 'Una tarea grande paraliza. Escribe abajo la primera acción física, por ejemplo abrir un archivo o sacar el cuaderno. Solo eso.' },
  { id: 'cansado', label: 'Cansancio', color: '#C9B8E8', title: 'Haz la versión mínima', tip: 'Hoy vale la versión más chica de tu hábito. Si después de 5 minutos sigues agotado, descansar también es una buena decisión.' },
  { id: 'ansiedad', label: 'Ansiedad', color: '#F28B82', title: 'Primero, respira', tip: 'Inhala 4 segundos, mantén 4 y exhala 6. Repite dos veces. Después elige un paso pequeño y concreto.' },
  { id: 'miedo', label: 'Miedo a hacerlo mal', color: '#F4A261', title: 'Tienes permiso para hacerlo mal', tip: 'El primer intento no tiene que ser bueno, solo tiene que existir. Después lo mejoras.' }
];

export const DAY_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
export const DAY_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Ideas para crear un hábito rápido (el usuario siempre puede escribir el suyo).
export const HABIT_IDEAS = [
  { area: 'estudio', title: 'Estudiar', min: 'Responder 5 preguntas', normal: 'Estudiar 25 minutos', epic: 'Estudiar 1 hora', identity: 'Soy alguien que estudia cada día' },
  { area: 'entreno', title: 'Entrenar', min: 'Calentar 10 minutos', normal: 'Hacer la rutina', epic: 'Rutina completa + extra', identity: 'Soy alguien que entrena' },
  { area: 'proyectos', title: 'Avanzar mi proyecto', min: 'Abrirlo 5 minutos', normal: 'Trabajar 15 minutos', epic: 'Trabajar 45 minutos', identity: 'Soy alguien que termina sus proyectos' },
  { area: 'estudio', title: 'Leer', min: 'Leer 1 página', normal: 'Leer 15 minutos', epic: 'Leer un capítulo', identity: 'Soy alguien que lee' },
  { area: 'hogar', title: 'Meditar', min: '3 respiraciones profundas', normal: 'Meditar 5 minutos', epic: 'Meditar 15 minutos', identity: 'Soy alguien que cuida su mente' },
  { area: 'hogar', title: 'Ordenar mi pieza', min: 'Guardar 3 cosas', normal: 'Ordenar 10 minutos', epic: 'Ordenar todo', identity: 'Soy alguien ordenado con su espacio' },
  { area: 'entreno', title: 'Caminar', min: 'Caminar 5 minutos', normal: 'Caminar 20 minutos', epic: 'Caminar 45 minutos', identity: 'Soy alguien que se mueve' },
  { area: 'hogar', title: 'Dormir temprano', min: 'Celular lejos 15 min antes', normal: 'Acostarme a la hora', epic: 'Acostarme 30 min antes', identity: 'Soy alguien que descansa bien' }
];

export const PHRASES = {
  tap: ['¡Hola!', '¡Vamos que se puede!', 'Solo 5 minutos y ya.', 'Me gusta estar contigo', '¿Partimos por lo más fácil?', '¡Jeje, cosquillas!', 'Hoy sumamos un voto más', 'Respira… y empezamos'],
  spin: '¡Basta, jaja!',
  wake: '¡Ah! Estaba soñando contigo…',
  missed: 'Te extrañé. ¿Hacemos la versión mínima?',
  allDone: '¡Día completo! Qué orgullo',
  rescueStart: 'Aquí estoy, tú puedes',
  rescueDone: '¡Lo lograste! +1 comodín'
};
