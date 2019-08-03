import * as React from 'react'
import { Paper, Typography, makeStyles } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  string: {
    padding: theme.spacing(1, 1),
  },
  char: {
    padding: theme.spacing(1, 3),
  },
}))

export interface KappLegendProps {
  title: string
}

export function KappLegend({ title }: KappLegendProps): React.ReactElement {
  const classes = useStyles()
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '100%',
      }}
    >
      <Paper className={title.length === 1 ? classes.char : classes.string}>
        <Typography align="center" style={{ fontFamily: 'monospace' }}>
          {title}
        </Typography>
      </Paper>
    </div>
  )
}
