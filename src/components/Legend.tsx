import { makeStyles, Paper, Typography } from '@material-ui/core'
import * as React from 'react'
import { kappColor } from '../kapps'
import { Kapp } from '../types'

const useStyles = makeStyles(theme => ({
  string: {
    padding: theme.spacing(1, 1),
  },
  char: {
    padding: theme.spacing(1, 3),
  },
}))

export interface KappLegendProps {
  kapp: Kapp
}

export function KappLegend({ kapp }: KappLegendProps): React.ReactElement {
  const classes = useStyles()
  const titleRef = React.useRef(null)
  const title = kapp.legend

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <Paper
        className={title.length === 1 ? classes.char : classes.string}
        style={{ backgroundColor: kappColor(kapp) }}
      >
        <Typography ref={titleRef} align="center">
          {title}
        </Typography>
      </Paper>
    </div>
  )
}
