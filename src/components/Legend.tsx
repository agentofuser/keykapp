import * as React from 'react'
import { Paper, Typography, makeStyles } from '@material-ui/core'
import { Kapp } from '../types'
import { kappColor } from '../kapps'

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
  const title = kapp.legend
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '100%',
      }}
    >
      <Paper
        className={title.length === 1 ? classes.char : classes.string}
        style={{ backgroundColor: kappColor(kapp) }}
      >
        <Typography align="center" style={{ fontFamily: 'monospace' }}>
          {title}
        </Typography>
      </Paper>
    </div>
  )
}
