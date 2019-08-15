import Card from '@material-ui/core/Card'
import CardActionArea from '@material-ui/core/CardActionArea'
import CardContent from '@material-ui/core/CardContent'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/styles'
import { map } from 'fp-ts/es6/Array'
import * as React from 'react'
import { getKappById } from '../kapps'
import { stringClamper } from '../kitchensink/purefns'
import { reachableKapps } from '../navigation/huffman'
import { AppAction, Kapp, Keybinding } from '../types'
import { KappLegend } from './Legend'

const useStyles = makeStyles({
  button: {
    height: '100%',
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
    justifyContent: 'center',
  },
})

interface ButtonProps {
  dispatch: React.Dispatch<AppAction>
  keybinding: Keybinding
}

export default function HuffmanButton({
  dispatch,
  keybinding,
}: ButtonProps): React.ReactElement {
  const classes = useStyles()

  const kappIdv0 = keybinding[1].value.kappIdv0
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
          {kappIdv0 ? (
            <KappLegend title={getKappById(kappIdv0).legend}></KappLegend>
          ) : (
            <Typography align="left" style={{ fontFamily: 'monospace' }}>
              {stringClamper(200)(
                map((kapp: Kapp): string => kapp.shortAsciiName)(
                  reachableKapps(keybinding[1])
                ).join(' ')
              )}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
