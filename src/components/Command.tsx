import * as React from 'react'
import Card from '@material-ui/core/Card'
import CardActionArea from '@material-ui/core/CardActionArea'
import CardContent from '@material-ui/core/CardContent'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles({
  button: {
    height: 150,
  },
  buttonActionArea: {
    width: '100%',
    height: '100%',
  },
})

export default function Command({
  title,
}: {
  title: string
}): React.ReactElement {
  const classes = useStyles()
  return (
    <Card className={classes.button}>
      <CardActionArea className={classes.buttonActionArea}>
        <CardContent>
          <Typography align="center">{title}</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
