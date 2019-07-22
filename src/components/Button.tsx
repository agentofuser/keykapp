import Card from '@material-ui/core/Card'
import CardActionArea from '@material-ui/core/CardActionArea'
import CardContent from '@material-ui/core/CardContent'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/styles'
import { map } from 'fp-ts/es6/Array'
import { fold } from 'fp-ts/es6/Option'
import * as React from 'react'
import { reachableKapps } from '../navigation/huffman'
import { AppAction, Kapp, Keybinding, Legend } from '../types'

const useStyles = makeStyles({
  button: {
    height: 180,
  },
  buttonActionArea: {
    width: '100%',
    height: '100%',
  },
  buttonContent: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
})

function clampString(str: string): string {
  const maxLength = 50
  if (str.length > maxLength) {
    const clamped = str
      .slice(0, maxLength)
      .split(' ')
      .slice(0, -1)
      .join(' ')
    return clamped + ' [...]'
  } else {
    return str
  }
}

interface ButtonProps {
  dispatch: React.Dispatch<AppAction>
  keybinding: Keybinding
}

export default function Button({
  dispatch,
  keybinding,
}: ButtonProps): React.ReactElement {
  const classes = useStyles()
  return (
    <Card className={classes.button}>
      <CardActionArea
        onMouseUp={(): void =>
          dispatch({
            type: 'KeyswitchUp',
            data: { timestamp: Date.now(), keybinding },
          })
        }
        className={classes.buttonActionArea}
      >
        <CardContent className={classes.buttonContent}>
          {fold(
            (): Legend => (
              <Typography align="center">
                {clampString(
                  map((kapp: Kapp): string => kapp.shortAsciiName)(
                    reachableKapps(keybinding[1])
                  ).join(' ')
                )}
              </Typography>
            ),
            (kapp: Kapp): Legend => kapp.legend
          )(keybinding[1].value.kapp)}

          <Typography align="center" color="textSecondary">
            {keybinding[0].key}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
