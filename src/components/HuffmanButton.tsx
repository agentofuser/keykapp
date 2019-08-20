import Card from '@material-ui/core/Card'
import CardActionArea from '@material-ui/core/CardActionArea'
import { makeStyles } from '@material-ui/styles'
import { map } from 'fp-ts/es6/Array'
import * as React from 'react'
import { getKappById } from '../kapps'
import { reachableKapps } from '../navigation/huffman'
import { AppAction, Kapp, Keybinding, LeftHand } from '../types'
import { KappLegend } from './Legend'

const useStyles = makeStyles({
  button: {
    padding: '1em',
  },
  buttonActionArea: {},
  reachableKapps: {
    fontFamily: 'monospace',
    fontSize: 10,
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
  const textAlign = keybinding[0].hand === LeftHand ? 'right' : 'left'

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
        {kappIdv0 ? (
          <KappLegend title={getKappById(kappIdv0).legend}></KappLegend>
        ) : (
          <div className={classes.reachableKapps} style={{ textAlign }}>
            {map(
              (kapp: Kapp): React.ReactNode => (
                <React.Fragment>
                  <span
                    style={{
                      lineHeight: 1.5,
                      backgroundColor: '#eee',
                      color: 'black',
                    }}
                  >
                    {kapp.shortAsciiName}
                  </span>{' '}
                </React.Fragment>
              )
            )(reachableKapps(keybinding[1]))}
          </div>
        )}
      </CardActionArea>
    </Card>
  )
}
