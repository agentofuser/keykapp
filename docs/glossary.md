# Keykapp Glossary

- **Keybinding**: one specific **Keyswitch** to **Waypoint** mapping.
- **Display**: the non-interactive visible area that renders the output buffer,
  the **Keykapp** state visualizations (ngrams, **Kapp** graph), and any other
  data projection.
- **Instruction**: the actual code that the computer executes when the user
  calls a **Kapp** by actuating a **Keyswitch** mapped to a **Waypoint** that
  holds a reference to the **Kapp**.
- **Kapp**: a leaf command which is part of the standard library or can be
  installed from friends or 3rd parties. Example: "push the character 'a' into
  the output buffer", "tweet the current output buffer", or "make previous word
  bold". Basically a **Legend** + an **Instruction**.
- **Keypad**: set of **Keyswitches**. They should be allowed to vary in number
  from 2 to a large N (e.g. to the number of keys in a regular computer
  keyboard, plus pedals, mouse buttons, IoT push buttons, etc.)
- **Keyswitch**: an actionable placeholder that corresponds to a human actuator
  (e.g. a finger). A **Keyswitch** can be dynamically mapped to any
  **Waypoint**.
- **Layout**: a mapping from **Keyswitches** to **Waypoints**, aka, an ordered
  set of **Keybindings**.
- **Legend**: The visual/auditory/sensory representation/description of what a
  **Kapp** does. The simplest case would be the inner html of a `<button>`
  element.
- **LoadBalancer**: maps a list of **Waypoints** to a list of **Keyswitches**
  based on usage history and some optimization criteria, e.g.: even out finger
  use; improve muscle memory by preferring previously-used assignments, etc.
- **Waypoint**: a node in the **Kapp** navigation graph. Its **Legend** shows a
  summary of the **Waypoints** that following it leads to. Pressing its
  corresponding **Keyswitch** replaces the current **Layout** with a new one
  based on the Waypoint's children ("forest"). If it's a leaf Waypoint,
  pressing its Keyswitch runs the associated Kapp and points the Layout back to
  the root of the navigation tree.

## Credits

Thanks to the very helpful
[MechTYPE Glossary of Mechanical Keyboard Terms and Definitions](http://www.mechtype.com/mechanical-keyboard-terminology/)
which served as inspiration for many Keykapp terms.
