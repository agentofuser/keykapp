type Legend = React.ReactNode
type Instruction = AppReducer

export interface Keyswitch {
  key: React.Key
}

export interface Command {
  idv0: string
  legend: Legend
  instruction: Instruction
}

export type Keybinding = [Keyswitch, Command]
export type Layout = Map<Keyswitch, Command>

export interface AppAction {
  type: string
  data: {
    timestamp: number
    keyswitch: Keyswitch
    command: Command
  }
}

type AppActionLog = AppAction[]
export interface AppState {
  appActionLog: AppActionLog
  currentBuffer: string
  currentLayout: Layout
}

export type AppReducer = React.Reducer<AppState, AppAction>
