import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { Incidencia, Persona } from '../types'
import { areaLabel, APP_TITLE, COMPANY_NAME, formatDate, turnoLabel } from './constants'
import { formatEstados } from './estados'
import { alaLabel } from './habitaciones'
import { formatListaConOtros } from './listas'
import { prioridadLabel } from './prioridades'
import { formatTratamientos } from './tratamientos'

function personaById(personas: Persona[], id: string): Persona | undefined {
  return personas.find((p) => p.id === id)
}

function boolMark(v: boolean): string {
  return v ? 'X' : ''
}

export function exportIncidenciasExcel(
  items: Incidencia[],
  personas: Persona[],
  filename = 'incidencias.xlsx',
): void {
  const rows = items.map((item) => {
    const p = personaById(personas, item.personaId)
    return {
      Fecha: formatDate(item.fecha),
      Turno: item.turno,
      Código: p?.codigo ?? '',
      Ala: p ? alaLabel(p.ala) : '',
      Habitación: p?.habitacion ?? '',
      DE: item.de,
      A: item.a,
      Estado: formatListaConOtros(item.estado, item.estadoOtros),
      Incidencia: item.incidencia,
      Prioridad: item.prioridad ? prioridadLabel(item.prioridad) : '',
      Lesiones: item.lesiones,
      'Caída N.A.F': boolMark(item.caidaNaf),
      'Caída A.F': boolMark(item.caidaAf),
      'Hospital TRAS': boolMark(item.hospitalTras),
      'Hospital REGR': boolMark(item.hospitalRegr),
      Dieta: formatListaConOtros(item.dieta, item.dietaOtros),
      Tratamiento: formatTratamientos(
        item.tratamiento,
        item.tratamientoOtros,
        item.tratamientoOtrosHora,
        item.tratamientoOtrosForma,
        item.tratamientoOtrosFormaOtros,
      ),
      Proceso: formatListaConOtros(item.proceso, item.procesoOtros),
      Desde: item.desde ? formatDate(item.desde) : '',
      Hasta: item.hasta ? formatDate(item.hasta) : '',
      'Ctes P': item.ctesP,
      'Ctes T': item.ctesT,
      'Ctes S': item.ctesS,
      'Ctes TA': item.ctesTa,
      'Ctes Glucemia': item.ctesGlucemia ?? '',
      'Ctes Peso': item.ctesPeso ?? '',
      Observaciones: item.observaciones,
      Firma: item.firma,
      Registrado: item.createdAt,
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Incidencias')
  XLSX.writeFile(wb, filename)
}

export function exportIncidenciasPdf(
  items: Incidencia[],
  personas: Persona[],
  filename = 'registro-incidencias.pdf',
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  doc.setFontSize(14)
  doc.text(COMPANY_NAME, 14, 14)
  doc.setFontSize(10)
  doc.text(APP_TITLE, 14, 20)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Exportado: ${new Date().toLocaleString('es-ES')}`, 14, 26)
  doc.setTextColor(0)

  const body = items.map((item) => {
    const p = personaById(personas, item.personaId)
    return [
      `${formatDate(item.fecha)} ${item.turno}`,
      p?.codigo ?? '—',
      p ? `${alaLabel(p.ala)} · ${p.habitacion}` : '—',
      `${item.de} → ${item.a}`,
      formatEstados(item.estado) + (item.estadoOtros.trim() ? ` · Otros: ${item.estadoOtros.trim()}` : ''),
      item.incidencia,
      item.lesiones,
      `${boolMark(item.caidaNaf)}/${boolMark(item.caidaAf)}`,
      `${boolMark(item.hospitalTras)}/${boolMark(item.hospitalRegr)}`,
      [
        formatListaConOtros(item.dieta, item.dietaOtros),
        formatTratamientos(
          item.tratamiento,
          item.tratamientoOtros,
          item.tratamientoOtrosHora,
          item.tratamientoOtrosForma,
          item.tratamientoOtrosFormaOtros,
        ),
        formatListaConOtros(item.proceso, item.procesoOtros),
      ]
        .filter((v) => v)
        .join(' · ') || '—',
      item.firma,
    ]
  })

  autoTable(doc, {
    startY: 24,
    head: [[
      'Fecha/T',
      'Código',
      'Hab.',
      'DE→A',
      'Estado',
      'Incidencia',
      'Lesiones',
      'Caída',
      'Hosp.',
      'Dieta/Trat.',
      'Firma',
    ]],
    body,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [15, 118, 110] },
    margin: { left: 10, right: 10 },
  })

  let y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 30

  const withObs = items.filter((i) => i.observaciones.trim())
  if (withObs.length) {
    y += 8
    doc.setFontSize(11)
    doc.text('Observaciones', 14, y)
    y += 4
    doc.setFontSize(8)

    for (const item of withObs) {
      const p = personaById(personas, item.personaId)
      const line = `(*) ${formatDate(item.fecha)}/${item.turno} · ${p?.codigo ?? ''}: ${item.observaciones}`
      const wrapped = doc.splitTextToSize(line, 270)
      if (y + wrapped.length * 4 > 190) {
        doc.addPage()
        y = 16
      }
      doc.text(wrapped, 14, y)
      y += wrapped.length * 4 + 2
    }
  }

  doc.save(filename)
}

export function exportSingleIncidenciaPdf(
  item: Incidencia,
  persona: Persona | undefined,
): void {
  exportIncidenciasPdf([item], persona ? [persona] : [], `incidencia-${item.id.slice(0, 8)}.pdf`)
}

export { areaLabel, turnoLabel }
