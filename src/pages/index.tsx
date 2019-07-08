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
  displayGridItemContainer: {
    border: '1px solid green',
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 1fr',
  },
  displayGridItem: {
    border: '1px solid pink',
  },
  keypadGridItemContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
    gridColumnGap: '16px',
    border: '1px solid red',
    margin: '0 32px',
  },
})

export default function App(): React.ReactNode {
  const classes = useStyles()
  const commandCards = map(
    (i: number): React.ReactElement => (
      <Command title={`${i}`} key={`commandKey${i}`} />
    )
  )(range(0, 7))
  return (
    <React.Fragment>
      <Helmet title="#Keycapp🧢"></Helmet>
      <Container maxWidth="lg">
        <Box my={4}>
          <Typography variant="h5" component="h1" gutterBottom>
            #Keycapp🧢
          </Typography>
          <div className={classes.mainGridContainer}>
            <div className={classes.displayGridItemContainer}>
              <div className={classes.displayGridItem}>commandNgrams</div>
              <div className={classes.displayGridItem}>outputBuffer</div>
              <div className={classes.displayGridItem}>commandDag</div>
            </div>
            <div className={classes.keypadGridItemContainer}>
              {commandCards}
            </div>
          </div>
        </Box>
      </Container>
    </React.Fragment>
  )
}
