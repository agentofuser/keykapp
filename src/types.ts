import * as Automerge from 'automerge'
import { Tree } from 'fp-ts/es6/tree'

export type Legend = string
export type Instruction = AppReducer

export type LeftHand = 'LeftHand'
export type RightHand = 'RightHand'
export const LeftHand: LeftHand = 'LeftHand'
export const RightHand: RightHand = 'RightHand'
export type Hand = LeftHand | RightHand
export interface Keyswitch {
  index: number
  hand: Hand
  key: React.Key
  actuationCost: number
}

export interface Kapp {
  idv0: string
  shortAsciiName: string
  legend: Legend
  instruction: Instruction
}

export interface HuffmanWeighted {
  huffmanWeight: number
}

export interface WaypointValue extends HuffmanWeighted {
  kappIdv0: string | null
}

export type Waypoint = Tree<WaypointValue>

export type Keybinding = [Keyswitch, Waypoint]
export type Layout = Keybinding[]

export interface AppAction {
  type: string
  data: {
    timestamp: number
    keybinding: Keybinding
  }
}

export type AppActionLog = AppAction[]

export interface SyncRoot {
  appActionLog: AppActionLog
  currentBuffer: string
  rootWaypoint: Waypoint
  waypointBreadcrumbs: Automerge.UUID[]
}

export type AppState = Automerge.Doc<SyncRoot>

export type AppReducer = React.Reducer<AppState, AppAction>
