import Container from '@material-ui/core/Container'
import Card from '@material-ui/core/Card'
import CardActionArea from '@material-ui/core/CardActionArea'
import CardContent from '@material-ui/core/CardContent'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/styles'
import * as React from 'react'

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
  legend,
  keyswitchHint,
}: {
  legend: string
  keyswitchHint: string
}): React.ReactElement {
  const classes = useStyles()
  return (
    <Card className={classes.button}>
      <CardActionArea className={classes.buttonActionArea}>
        <CardContent className={classes.buttonContent}>
          <Typography align="center">{legend}</Typography>
          <Container>
            <Typography align="center" color="textSecondary">
              {keyswitchHint}
            </Typography>
          </Container>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
