import { Tree } from 'fp-ts/es6/tree'
import { NonEmptyArray } from 'fp-ts/es6/NonEmptyArray'
import * as Automerge from 'automerge'

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

export interface AppState {
  readonly syncDoc: Automerge.Doc<any>
  readonly appActionLog: AppActionLog
  readonly currentBuffer: string
  readonly rootWaypoint: Waypoint
  readonly waypointBreadcrumbs: NonEmptyArray<Waypoint>
}

export type AppReducer = React.Reducer<AppState, AppAction>
