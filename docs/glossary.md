# Keycapp Glossary

- **Display**: the non-interactive visible area that renders the output buffer,
  the **Keycapp** state visualizations (ngrams, **Command** graph), and any
  other data projection.
- **Keyswitch**: an actionable placeholder that corresponds to a human actuator
  (e.g. a finger). A **Keyswitch** can be dynamically mapped to any **Kapp** or
  **Waypoint**.
- **Legend**: The visual/auditory/sensory representation/description of what a
  **Command** does.
- **Keypad**: set of **Keyswitches**. They should be allowed to vary in number
  from 2 to a large N (e.g. to the number of keys in a regular computer
  keyboard, plus pedals, mouse buttons, IoT push buttons, etc.)
- **Layout**: a mapping from **Keyswitches** to **Commands**, aka, an ordered
  set of **Buttons**.
- **Kapp**: a leaf **Command** which is part of the standard library or can be
  installed from friends or 3rd parties. Example: "push the character 'a' into
  the output buffer."
- **Command**: either a **Waypoint** or a **Kapp**. Basically a **Legend** + an
  **Instruction**.
- **Instruction**: the actual code that the computer executes when the user
  issues a **Command** by actuating its **Keyswitch**.
- **Button**: one specific **Command** + **Keyswitch** mapping.
- **Waypoint**: a non-leaf node in the **Command** graph. Its **Legend** shows
  a summary of the **Commands** that following it leads to. Pressing its
  corresponding **Keyswitch** replaces the current **Layout** with a new one.

## Credits

Thanks to the very helpful
[MechTYPE Glossary of Mechanical Keyboard Terms and Definitions](http://www.mechtype.com/mechanical-keyboard-terminology/)
which served as inspiration for many Keycapp terms.
