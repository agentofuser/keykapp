import { Option } from 'fp-ts/es6/Option'
import { Tree } from 'fp-ts/es6/tree'
import { HuffmanWeighted } from './navigation/huffman'

export type Legend = React.ReactNode
export type Instruction = AppReducer

export interface Keyswitch {
  key: React.Key
}

export interface Kapp {
  idv0: string
  shortAsciiName: string
  legend: Legend
  instruction: Instruction
  actuationCount: number // denormalization
}

export interface WaypointValue extends HuffmanWeighted {
  parent: Option<Waypoint>
  kapp: Option<Kapp>
}

export type Waypoint = Tree<WaypointValue>

export type Keybinding = [Keyswitch, Waypoint]
export type Layout = Map<Keyswitch, Waypoint>

export interface AppAction {
  type: string
  data: {
    timestamp: number
    keybinding: Keybinding
  }
}

type AppActionLog = AppAction[]

export interface AppState {
  readonly appActionLog: AppActionLog
  readonly currentBuffer: string
  readonly rootWaypoint: Waypoint
  readonly currentWaypoint: Waypoint
}

export type AppReducer = React.Reducer<AppState, AppAction>
