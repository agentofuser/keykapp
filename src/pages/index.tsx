import * as React from 'react'
import Container from '@material-ui/core/Container'
import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import { Helmet } from 'react-helmet'

export default function App(): React.ReactNode {
  return (
    <React.Fragment>
      <Helmet title="#Keycapp🧢"></Helmet>
      <Container maxWidth="sm">
        <Box my={4}>
          <Typography variant="h2" component="h1" gutterBottom>
            #Keycapp🧢
          </Typography>
        </Box>
        <Button variant="contained" color="primary">
          Hi!
        </Button>
      </Container>
    </React.Fragment>
  )
}
