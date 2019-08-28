import * as Automerge from 'automerge'
import { Sexp } from '../types'

function t(str: string): Automerge.Text {
  return new Automerge.Text(str)
}

const textLessonBody = `
So yeah, this is (for now) all there is to Keykapp:

- Write, make lists, outline,
- Then \`:copy\` out what you typed and paste it somewhere else.

All this with only 4 buttons!

Keykapp learns with your history (which never leaves your phone) so you type as little as possible.
`

const tutorial: Sexp = [
  t('Welcome to Keykapp!'),
  t('Find `:focus-prev` below'),
  [
    t('`:zoom-in` here for a tutorial'),
    t('Nice zooming! Keykapp is based on lists'),
    t('Lists can have text items and...'),
    [t('Check this out: lists within lists!')],
    t('Zoom into this text here to continue.\n' + textLessonBody),
  ],
  t('Then plz tweet me feedback at @Keykapp =)'),
  t('Tip: press the 4 buttons below with dfjk.'),
]

export default tutorial
