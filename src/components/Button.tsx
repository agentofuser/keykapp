import Card from '@material-ui/core/Card'
import CardActionArea from '@material-ui/core/CardActionArea'
import CardContent from '@material-ui/core/CardContent'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/styles'
import * as React from 'react'
import { AppAction, Command, Keyswitch } from '../types'

const useStyles = makeStyles({
  button: {
    height: 150,
  },
  buttonActionArea: {
    width: '100%',
    height: '100%',
  },
  buttonContent: {
    display: 'grid',
    gridTemplateRows: '3fr 1fr',
    gridRowGap: '0.5rem',
  },
})

interface ButtonProps {
  dispatch: React.Dispatch<AppAction>
  command: Command
  keyswitch: Keyswitch
}

export default function Button({
  dispatch,
  command,
  keyswitch,
}: ButtonProps): React.ReactElement {
  const classes = useStyles()
  return (
    <Card className={classes.button}>
      <CardActionArea
        onMouseUp={(): void =>
          dispatch({
            type: 'KeyswitchUp',
            data: { timestamp: Date.now(), keyswitch, command },
          })
        }
        className={classes.buttonActionArea}
      >
        <CardContent className={classes.buttonContent}>
          {command.legend}

          <Typography align="center" color="textSecondary">
            {keyswitch.key}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
