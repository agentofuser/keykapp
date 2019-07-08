import * as React from 'react'
import { Helmet } from 'react-helmet'
import Container from '@material-ui/core/Container'
import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box'
import { makeStyles } from '@material-ui/styles'
import Command from '../components/Command'
import { range, map } from 'fp-ts/es6/Array'

const useStyles = makeStyles({
  mainGridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '4fr 1fr',
    gridColumnGap: '16px',
    gridRowGap: '16px',
  },
  display: {
    border: '1px solid green',
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 1fr',
  },
  displayItem: {
    border: '1px solid pink',
  },
  keypad: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
    gridColumnGap: '16px',
    border: '1px solid red',
    margin: '0 32px',
  },
})

export default function App(): React.ReactNode {
  const classes = useStyles()
  const commandButtons = map(
    (i: string): React.ReactElement => (
      <Command title={`${i}`} keyswitchHint={i} key={`keyswitch-${i}`} />
    )
  )(['a', 's', 'd', 'f', 'j', 'k', 'l', ';'])
  return (
    <React.Fragment>
      <Helmet title="#Keycapp🧢"></Helmet>
      <Container maxWidth="lg">
        <Box my={4}>
          <Typography variant="h5" component="h1" gutterBottom>
            #Keycapp🧢
          </Typography>
          <div className={classes.mainGridContainer}>
            <div className={classes.display}>
              <div className={classes.displayItem}>commandNgrams</div>
              <div className={classes.displayItem}>outputBuffer</div>
              <div className={classes.displayItem}>commandGraph</div>
            </div>
            <div className={classes.keypad}>{commandButtons}</div>
          </div>
        </Box>
      </Container>
    </React.Fragment>
  )
}
