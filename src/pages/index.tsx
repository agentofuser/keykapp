import * as React from 'react'
import Button from '@material-ui/core/Button'

const FrontPage: React.FunctionComponent = (): React.ReactElement => (
  <div>
    <h1>Hello, worlds!</h1>
    <Button variant="contained" color="primary">
      Hi!
    </Button>
  </div>
)

export default FrontPage
