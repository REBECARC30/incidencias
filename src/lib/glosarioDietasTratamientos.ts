export interface GlosarioItem {
  nombre: string
  significado: string
  ejemplos: string
}

export interface GlosarioGrupo {
  categoria: string
  items: GlosarioItem[]
}

export const GLOSARIO_DIETAS: GlosarioGrupo[] = [
  {
    categoria: 'TIPOS DE DIETA',
    items: [
      {
        nombre: 'ABSOLUTA',
        significado: 'Supresión completa de alimento y bebida en la dieta por un determinado tiempo.',
        ejemplos: 'Ninguno',
      },
      {
        nombre: 'LÍQUIDA',
        significado:
          'Líquidos y alimentos que son normalmente líquidos o se vuelven líquidos a temperatura ambiente.',
        ejemplos: 'Agua, zumos, caldos colados, gelatina, suplementos líquidos…',
      },
      {
        nombre: 'ASTRINGENTE',
        significado: 'Alimentación recomendada durante procesos de diarrea.',
        ejemplos: 'Agua de arroz, sémola, arroz hervido, pollo/pescado hervido…',
      },
      {
        nombre: 'BAJA EN RESÍDUOS',
        significado: 'Restricción de todo tipo de fibra para reducir el volumen fecal.',
        ejemplos: 'Arroz blanco, pasta, pan blanco, caldos colados, patata hervida…',
      },
      {
        nombre: 'HIPERPROTEICA',
        significado: 'Dieta enriquecida en proteínas con menor aporte de hidratos de carbono.',
        ejemplos: 'Carnes, pescado, clara de huevo, legumbres, frutos secos…',
      },
      {
        nombre: 'DIABÉTICA',
        significado: 'Dieta equilibrada adaptada al control glucémico.',
        ejemplos: 'Evitar zumos, repostería y exceso de hidratos de carbono.',
      },
      {
        nombre: 'BLANDA',
        significado: 'Fácil digestión, sin irritar el sistema digestivo.',
        ejemplos: 'Evitar irritantes, picantes, condimentos en exceso y fritos.',
      },
      {
        nombre: 'DE FÁCIL MASTICACIÓN',
        significado: 'Textura blanda para disfagia, problemas dentales o reflujo.',
        ejemplos: 'Alimentos blandos a temperatura templada y/o fría.',
      },
    ],
  },
]

export const GLOSARIO_TRATAMIENTOS: GlosarioGrupo[] = [
  {
    categoria: 'FARMACOLÓGICO',
    items: [
      {
        nombre: 'ADMINISTRAR FÁRMACO',
        significado:
          'Uso de fármacos para prevenir, diagnosticar, tratar o aliviar síntomas.',
        ejemplos: 'Dar paracetamol, medicación PRN, medicación habitual…',
      },
      {
        nombre: 'APLICAR TRAUMEL',
        significado: 'Aplicación tópica de preparado homeopático antiinflamatorio.',
        ejemplos: '',
      },
      {
        nombre: 'SUEROTERAPIA',
        significado: 'Administración de fluidos y electrolitos por vía intravenosa.',
        ejemplos: '',
      },
    ],
  },
  {
    categoria: 'NO FARMACOLÓGICO',
    items: [
      {
        nombre: 'DAR CAFÉ CON LECHE',
        significado: 'Intervención no farmacológica de confort o estimulación.',
        ejemplos: '',
      },
      {
        nombre: 'MANTA',
        significado: 'Medida de confort térmico.',
        ejemplos: '',
      },
      {
        nombre: 'TERAPIA CON EL MUÑECO',
        significado: 'Intervención terapéutica no farmacológica.',
        ejemplos: '',
      },
      {
        nombre: 'PASEO',
        significado: 'Movilización y estimulación fuera de la habitación.',
        ejemplos: '',
      },
      {
        nombre: 'MUSICOTERAPIA',
        significado: 'Intervención terapéutica mediante música.',
        ejemplos: '',
      },
      {
        nombre: 'HIGIENE POSTURAL',
        significado: 'Colocación de cojines u otros elementos de postura.',
        ejemplos: 'Colocar cojines, cambios posturales…',
      },
      {
        nombre: 'TERMOTERAPIA',
        significado: 'Aplicación de calor o frío con fines terapéuticos.',
        ejemplos: 'Frío local, calor local…',
      },
    ],
  },
]

export const GLOSARIO_PROCESOS: GlosarioGrupo[] = [
  {
    categoria: 'ANALÍTICAS Y MUESTRAS',
    items: [
      {
        nombre: 'TIRA DE ORINA +',
        significado: 'Registro de tira reactiva de orina.',
        ejemplos: 'Comunicar a área sanitaria y registrar seguimiento.',
      },
      {
        nombre: 'RECOGIDA DE ORINA PARA SEDIMENTO',
        significado: 'Toma de muestra de orina para análisis de sedimento.',
        ejemplos: 'Muestra enviada a laboratorio.',
      },
      {
        nombre: 'RECOGIDA DE ORINA PARA CULTIVO',
        significado: 'Toma de muestra de orina para cultivo microbiológico.',
        ejemplos: 'Muestra enviada a laboratorio.',
      },
      {
        nombre: 'RECOGIDA DE HECES',
        significado: 'Toma de muestra fecal para análisis.',
        ejemplos: '',
      },
      {
        nombre: 'ANALÍTICA DE SANGRE',
        significado: 'Extracción o control analítico sanguíneo.',
        ejemplos: 'Glucemia, hemograma, bioquímica…',
      },
    ],
  },
  {
    categoria: 'CONTROLES Y SEGUIMIENTO',
    items: [
      {
        nombre: 'CONTROL DE CONSTANTES',
        significado: 'Toma y registro de constantes vitales.',
        ejemplos: 'Pulso, temperatura, saturación, tensión…',
      },
      {
        nombre: 'SEGUIMIENTO DEL ESTADO',
        significado: 'Observación continuada del estado de la persona.',
        ejemplos: 'Según plan de cuidados o indicación sanitaria.',
      },
      {
        nombre: 'CONTROL DE GLUCEMIA',
        significado: 'Medición y registro de glucemia capilar.',
        ejemplos: '',
      },
      {
        nombre: 'CONTROL DE PESO',
        significado: 'Pesaje y registro periódico.',
        ejemplos: '',
      },
      {
        nombre: 'CONTROL DE INGESTA',
        significado: 'Registro de ingestas alimentarias y hídricas.',
        ejemplos: 'Porcentaje ingerido, rechazos, ayuno…',
      },
    ],
  },
  {
    categoria: 'CUIDADOS Y VALORACIÓN',
    items: [
      {
        nombre: 'VALORACIÓN ENFERMERA',
        significado: 'Valoración clínica o revisión del plan de cuidados.',
        ejemplos: '',
      },
      {
        nombre: 'CAMBIO POSTURAL',
        significado: 'Cambio de posición según plan de prevención de UPP.',
        ejemplos: '',
      },
      {
        nombre: 'HIGIENE ASISTIDA',
        significado: 'Higiene corporal con ayuda del personal.',
        ejemplos: 'Ducha, lavado, higiene bucal…',
      },
      {
        nombre: 'ACOMPAÑAMIENTO EN COMEDOR',
        significado: 'Supervisión o ayuda durante la ingesta.',
        ejemplos: '',
      },
    ],
  },
  {
    categoria: 'COMUNICACIÓN',
    items: [
      {
        nombre: 'INFORME A FAMILIA',
        significado: 'Comunicación de información relevante a familiares.',
        ejemplos: '',
      },
      {
        nombre: 'INFORME A REFERENTE',
        significado: 'Comunicación al profesional de referencia.',
        ejemplos: '',
      },
      {
        nombre: 'REUNIÓN DE EQUIPO',
        significado: 'Comunicación en equipo asistencial.',
        ejemplos: 'Pase de turno, coordinación…',
      },
    ],
  },
]

export function findGlosarioItem(grupos: GlosarioGrupo[], nombre: string): GlosarioItem | undefined {
  for (const grupo of grupos) {
    const found = grupo.items.find((i) => i.nombre === nombre)
    if (found) return found
  }
  return undefined
}
