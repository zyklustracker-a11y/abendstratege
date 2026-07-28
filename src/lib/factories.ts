import { newId } from './id'
import type { AreaReflection, Draft, Hieb } from './types'

export function emptyReflection(areaId: string): AreaReflection {
  return {
    id: newId('refl'),
    areaId,
    success: '',
    levels: ['', '', '', '', ''],
    why: '',
    expand: '',
    nextSteps: [''],
  }
}

export function emptyHieb(source: Hieb['source'] = 'reflection'): Hieb {
  return { id: newId('hieb'), text: '', slot: '', time: '', done: false, source }
}

export function emptyDraft(date: string): Draft {
  return { date, reflections: [], hiebe: [emptyHieb()], insight: '' }
}
