export type Turno = 'M' | 'T' | 'N'

export type Prioridad = '' | 'baja' | 'normal' | 'alta' | 'urgente'

export type AreaCode =
  | 'A.D'
  | 'A.S'
  | 'A.T'
  | 'P.R'
  | 'EQ'
  | 'A.C'
  | 'A.L'
  | 'A.R'
  | 'A.CO'

export type UserRole = 'staff' | 'admin'

export interface AuthSession {
  workerId: string
  displayName: string
  role?: UserRole
}

export type Ala = '1' | '2'

export interface Persona {
  id: string
  codigo: string
  ala: Ala
  habitacion: string
  createdAt: string
}

export type FormaAdministracion =
  | 'oral'
  | 'sublingual'
  | 'topica'
  | 'intravenosa'
  | 'intramuscular'
  | 'subcutanea'
  | 'inhalada'
  | 'sonda'
  | 'no_farmacologico'
  | 'otra'
  | ''

export interface TratamientoRegistro {
  nombre: string
  farmaco: string
  horas: string[]
  forma: FormaAdministracion
  formaOtros: string
}

export interface Incidencia {
  id: string
  personaId: string
  fecha: string
  turno: Turno
  de: AreaCode[]
  a: AreaCode[]
  estado: string[]
  estadoOtros: string
  incidencia: string
  prioridad: Prioridad
  lesiones: string
  caidaNaf: boolean
  caidaAf: boolean
  hospitalTras: boolean
  hospitalRegr: boolean
  dieta: string[]
  dietaOtros: string
  dietaDesde: string
  dietaHasta: string
  tratamiento: TratamientoRegistro[]
  tratamientoOtros: string
  tratamientoDesde: string
  tratamientoHasta: string
  tratamientoOtrosHoras: string[]
  tratamientoOtrosForma: FormaAdministracion
  tratamientoOtrosFormaOtros: string
  proceso: string[]
  procesoOtros: string
  procesoDesde: string
  procesoHasta: string
  ctesP: string
  ctesT: string
  ctesS: string
  ctesTa: string
  ctesGlucemia: string
  ctesPeso: string
  observaciones: string
  firma: string
  firmaDibujo: string
  createdAt: string
  createdBy: string
}

export interface IncidenciaFilters {
  q: string
  fechaDesde: string
  fechaHasta: string
  turno: Turno | ''
  ala: Ala | ''
  tratamiento: string
  de: AreaCode | ''
  a: AreaCode | ''
  personaId: string
}
