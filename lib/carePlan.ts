// Domain rules shared by the demo and future persisted workflow.
// No clinical decisions: tasks must reproduce a confirmed source instruction.
export type Instruction = {
  id: string; personId: string; text: string; sourceId: string; sourceDate: string;
  professional: string; status: 'draft' | 'confirmed' | 'superseded';
  confirmedBy: string | null; confirmedAt: string | null; dueAt: string | null;
}
export function confirmInstruction(instruction: Instruction, actorId: string, now: string): Instruction {
  if (instruction.status !== 'draft' || !actorId || !instruction.personId || !instruction.text.trim() || !instruction.sourceId || !instruction.professional.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(instruction.sourceDate) || !Number.isFinite(Date.parse(instruction.sourceDate)) || !Number.isFinite(Date.parse(now))) {
    throw new Error('Revisá persona, documento, fecha, autor e indicación antes de confirmar.')
  }
  return { ...instruction, status: 'confirmed', confirmedBy: actorId, confirmedAt: now }
}
export function canSchedule(instruction: Instruction): boolean {
  return instruction.status === 'confirmed' && !!instruction.confirmedBy && !!instruction.confirmedAt && !!instruction.sourceId && !!instruction.dueAt && Number.isFinite(Date.parse(instruction.dueAt))
}
export function answerFromInstruction(instruction: Instruction): string {
  if (instruction.status !== 'confirmed') return 'La indicación todavía no está confirmada. Revisá el documento original.'
  return `${instruction.professional}, ${instruction.sourceDate}: «${instruction.text}» Fuente: ${instruction.sourceId}.`
}
