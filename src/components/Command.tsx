import * as React from 'react'
import Card from '@material-ui/core/Card'
import CardActionArea from '@material-ui/core/CardActionArea'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles({
  keycappCard: {
    height: 150,
  },
  keycappCardActionArea: {
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
    <Card className={classes.keycappCard}>
      <CardActionArea className={classes.keycappCardActionArea}>
        {title}
      </CardActionArea>
    </Card>
  )
}
