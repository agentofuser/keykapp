import Container from '@material-ui/core/Container'
import Card from '@material-ui/core/Card'
import CardActionArea from '@material-ui/core/CardActionArea'
import CardContent from '@material-ui/core/CardContent'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/styles'
import * as React from 'react'

import { AppAction } from '../pages/index'

const useState = React.useState

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

export default function Button({
  dispatch,
  legend,
  keyswitchId,
}: {
  dispatch: React.Dispatch<AppAction>
  legend: string
  keyswitchId: string
}): React.ReactElement {
  const classes = useStyles()
  return (
    <Card className={classes.button}>
      <CardActionArea
        onMouseUp={(): void =>
          dispatch({
            type: 'KeyswitchUp',
            data: { keyswitchId },
          })
        }
        className={classes.buttonActionArea}
      >
        <CardContent className={classes.buttonContent}>
          <Typography align="center">{legend}</Typography>
          <Container>
            <Typography align="center" color="textSecondary">
              {keyswitchId}
            </Typography>
          </Container>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
