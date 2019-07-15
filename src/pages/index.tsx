import * as React from 'react'
import { Helmet } from 'react-helmet'
import Container from '@material-ui/core/Container'
import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box'
import { makeStyles } from '@material-ui/styles'
import Button from '../components/Button'
import { range, map } from 'fp-ts/es6/Array'

const useStyles = makeStyles({
  mainGridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '4fr 1fr',
    gridColumnGap: '16px',
    gridRowGap: '16px',
  },
  display: {
    border: '1px solid green',
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 1fr',
  },
  displayItem: {
    border: '1px solid pink',
  },
  keypad: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
    gridColumnGap: '16px',
    border: '1px solid red',
    margin: '0 32px',
  },
})

function makePlaceholderButton(dispatch: React.Dispatch<AppAction>): any {
  return function makeButton({
    legend,
    keyswitchId,
  }: {
    legend: string
    keyswitchId: string
  }): React.ReactElement {
    return (
      <Button
        dispatch={dispatch}
        legend={legend}
        keyswitchId={keyswitchId}
        key={`keyswitch-${keyswitchId}`}
      />
    )
  }
}

export interface AppAction {
  type: string
  data: {
    keyswitchId: string
  }
}

interface AppState {
  appActionLog: AppAction[]
}

function appReducer(state: AppState, action: AppAction): AppState {
  const newState: AppState = { appActionLog: [...state.appActionLog, action] }

  return newState
}

export default function App(): React.ReactNode {
  const [state, dispatch] = React.useReducer(appReducer, { appActionLog: [] })

  function onKeyUp(event: KeyboardEvent): void {
    event.stopPropagation()
    event.preventDefault()
    dispatch({ type: 'KeyswitchUp', data: { keyswitchId: event.key } })
  }

  React.useEffect(() => {
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.removeEventListener('keyup', onKeyUp)
    }
  })

  const classes = useStyles()
  const commandButtons = map(makePlaceholderButton(dispatch))([
    {
      legend: 'write newline',
      keyswitchId: 'a',
    },
    {
      legend: 'write space',
      keyswitchId: 's',
    },
    {
      legend: "write '🧢'",
      keyswitchId: 'd',
    },
    {
      legend: "write 'o'",
      keyswitchId: 'f',
    },
    {
      legend: "write 'k'",
      keyswitchId: 'j',
    },
    {
      legend: 'upcase word',
      keyswitchId: 'k',
    },
    {
      legend: 'downcase word',
      keyswitchId: 'l',
    },
    {
      legend: 'delete word',
      keyswitchId: ';',
    },
  ])
  return (
    <React.Fragment>
      <Helmet title="#Keykapp🧢"></Helmet>
      <Container maxWidth="lg">
        <Box my={4}>
          <Typography variant="h5" component="h1" gutterBottom>
            #Keykapp🧢
          </Typography>
          <div className={classes.mainGridContainer}>
            <div className={classes.display}>
              <div className={classes.displayItem}>commandNgrams</div>
              <div className={classes.displayItem}>outputBuffer</div>
              <div className={classes.displayItem}>
                {JSON.stringify(state, null, 2)}
              </div>
            </div>
            <div className={classes.keypad}>{commandButtons}</div>
          </div>
        </Box>
      </Container>
    </React.Fragment>
  )
}
