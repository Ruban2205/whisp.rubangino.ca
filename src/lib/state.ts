import { appendSpokenText } from './speech'
export type Stage = 'landing' | 'entering' | 'writing' | 'releasing' | 'complete'
export interface RitualState { stage: Stage; text: string; released: string | null }
export type RitualEvent =
  | { type: 'ENTER' | 'ARRIVE' | 'RELEASE' | 'RELEASE_DONE' | 'RELEASE_FAILED' | 'UNDO' | 'EXPIRE' | 'AGAIN' | 'HOME' }
  | { type: 'EDIT' | 'APPEND_SPEECH'; text: string }
export const initialState: RitualState = { stage: 'landing', text: '', released: null }

/** Explicit transitions make rapid clicks and asynchronous audio callbacks harmless. */
export function ritualReducer(state: RitualState, event: RitualEvent): RitualState {
  switch (event.type) {
    case 'ENTER': return state.stage === 'landing' ? { ...state, stage: 'entering' } : state
    case 'ARRIVE': return state.stage === 'entering' ? { ...state, stage: 'writing' } : state
    case 'APPEND_SPEECH': return state.stage === 'writing' ? { ...state, text: appendSpokenText(state.text, event.text) } : state
    case 'EDIT': return state.stage === 'writing' ? { ...state, text: event.text } : state
    case 'RELEASE': return state.stage === 'writing' && state.text.trim() ? { ...state, stage: 'releasing' } : state
    case 'RELEASE_DONE': return state.stage === 'releasing' ? { stage: 'complete', text: '', released: state.text } : state
    case 'RELEASE_FAILED': return state.stage === 'releasing' ? { ...state, stage: 'writing' } : state
    case 'UNDO': return state.stage === 'complete' && state.released !== null ? { stage: 'writing', text: state.released, released: null } : state
    case 'EXPIRE': return { ...state, released: null }
    case 'AGAIN': return state.stage === 'complete' ? { stage: 'writing', text: '', released: null } : state
    case 'HOME': return state.stage === 'complete' || (state.stage === 'writing' && !state.text) ? initialState : state
    default: return state
  }
}
