import Card from '@material-ui/core/Card'
import CardActionArea from '@material-ui/core/CardActionArea'
import { makeStyles } from '@material-ui/styles'
import { mapWithIndex } from 'fp-ts/es6/Array'
import * as React from 'react'
import useDimensions from 'react-use-dimensions'
import { getKappById, kappColor } from '../kapps'
import { getStyle } from '../kitchensink/effectfns'
import { parsePx } from '../kitchensink/purefns'
import { reachableKapps } from '../navigation/huffman'
import { AppAction, Kapp, Keybinding, LeftHand, AppState } from '../types'
import { KappLegend } from './Legend'

const useStyles = makeStyles({
  button: {
    padding: '1em',
  },
  visited: {
    backgroundColor: '#eee !important',
  },
  buttonActionArea: {
    height: '100%',
  },
  multilegendDiv: {
    height: '100%',
    top: 0,
  },
  multilegendP: {
    wordWrap: 'break-word',
    margin: 0,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
})

interface ButtonProps {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  keybinding: Keybinding
}

export default function HuffmanButton({
  state,
  dispatch,
  keybinding,
}: ButtonProps): React.ReactElement {
  const classes = useStyles()
  const textAlign = keybinding[0].hand === LeftHand ? 'right' : 'left'
  const visited = state.tempRoot.menuIns.includes(keybinding[1])

  const [multilegendDivRef, multilegendDivSize] = useDimensions()
  const multilegendPRef = React.useRef(null)
  const offscreenSpan = React.useRef(null)

  // multiline clamp hack adapted from
  // https://stackoverflow.com/a/41144187/11343832
  React.useLayoutEffect((): void => {
    const p = multilegendPRef.current
    const span = offscreenSpan.current
    if (p && span) {
      const divHeight = multilegendDivSize.height
      const lineHeight = parsePx(getStyle(p, 'line-height'))

      const multilegendLineClamp = divHeight
        ? Math.floor(divHeight / lineHeight)
        : 1

      p.style.WebkitLineClamp = multilegendLineClamp
    }
  })

  const kappIdv0 = keybinding[1].value.kappIdv0
  return (
    <Card
      className={classes.button}
      classes={{ root: visited ? classes.visited : '' }}
    >
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
          <KappLegend kapp={getKappById(kappIdv0)}></KappLegend>
        ) : (
          <div ref={multilegendDivRef} className={classes.multilegendDiv}>
            <p
              ref={multilegendPRef}
              className={classes.multilegendP}
              style={{ textAlign, fontSize: '1rem', lineHeight: 1.5 }}
            >
              <span
                ref={offscreenSpan}
                style={{ position: 'absolute', top: -2000 }}
              >
                h
              </span>
              {mapWithIndex(
                (i: number, kapp: Kapp): React.ReactNode => (
                  <React.Fragment key={i}>
                    <span
                      style={{
                        backgroundColor: kappColor(kapp),
                        color: 'black',
                        borderLeft: `6px solid ${kappColor(kapp)}`,
                        borderRight: `6px solid ${kappColor(kapp)}`,
                      }}
                    >
                      {kapp.shortAsciiName}
                    </span>{' '}
                  </React.Fragment>
                )
              )(reachableKapps(keybinding[1]))}
            </p>
          </div>
        )}
      </CardActionArea>
    </Card>
  )
}
