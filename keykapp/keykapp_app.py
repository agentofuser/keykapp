# keykapp_app.py

import asyncio
from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Callable, Union
from textual.app import App, ComposeResult
from textual.widgets import TextArea


@dataclass(frozen=True)
class Kapp:
    """Base class for all kapps."""

    name: str
    description: Optional[str] = None

    def update(
        self, model: "Model", app: "KeykappApp"
    ) -> Tuple["Model", Optional["Command"]]:
        """Default behavior: insert the kapp's name."""
        if self.is_self_inserting():
            return (
                Model(kapp_history=model.kapp_history + [self]),
                Command(action=lambda: app.text_area.insert(self.name)),
            )
        return model, None

    def is_self_inserting(self) -> bool:
        """Check if the kapp is self-inserting (character or non-command)."""
        return not self.name.startswith(":")

    def __eq__(self, other) -> bool:
        """Semantic equality based on type and name."""
        if not isinstance(other, Kapp):
            return False
        return self.name == other.name


@dataclass(frozen=True)
class BackspaceKapp(Kapp):
    name: str = ":backspace"
    description: str = "Deletes the character to the left of the cursor."

    def update(
        self, model: "Model", app: "KeykappApp"
    ) -> Tuple["Model", Optional["Command"]]:
        """Perform a backspace operation."""
        new_model = Model(kapp_history=model.kapp_history + [self])
        return new_model, Command(
            action=lambda: app.text_area.action_delete_left()
        )


@dataclass
class Model:
    """Represents the state of the application."""

    kapp_history: List[Kapp] = field(default_factory=list)

    def serialize(self) -> List[str]:
        """Serialize the model's state to a list of strings for replay."""
        return [kapp.name for kapp in self.kapp_history]


@dataclass
class Command:
    """Represents an effect to be performed."""

    action: Callable[[], None]


class KeykappApp(App):
    def __init__(self):
        super().__init__()
        self.prelude = {
            ":backspace": BackspaceKapp(),
        }

    def compose(self) -> ComposeResult:
        # Create a TextArea widget
        self.text_area = TextArea()
        # Add the TextArea widget to the app's layout
        yield self.text_area

    def on_mount(self) -> None:
        self.text_area.show_line_numbers = True
        # Start the replay on mount
        self.call_later(self.replay)

    async def replay(self) -> None:
        # Load the kapps from the file
        kapps = self.load_kapps_from_file("commands.txt")

        # Initialize the model
        model = Model()

        # Process each kapp (command or character)
        for kapp_string in kapps:
            # Update the model and get the command to execute
            model, command = self.update(model, kapp_string)

            # Execute the command (if any)
            if command and command.action:
                command.action()

            # Wait for 0.1 seconds before processing the next kapp
            await asyncio.sleep(0.1)

    def load_kapps_from_file(self, filename: str) -> List[str]:
        try:
            with open(filename, "r") as file:
                # Read lines from the file and only strip the newline characters
                return [line.rstrip("\n") for line in file.readlines()]
        except FileNotFoundError:
            self.text_area.insert("Error: kapps file not found.")
            return []

    def update(
        self, model: Model, kapp_string: str
    ) -> Tuple[Model, Optional[Command]]:
        """Dispatcher function to update the model and execute commands based on kapps."""
        kapp = self.create_kapp(kapp_string)
        if kapp is None:
            self.exit_with_error(f"Invalid kapp: {kapp_string}")
        return kapp.update(model, self)

    def create_kapp(self, kapp_string: str) -> Optional[Kapp]:
        """Creates a kapp instance based on the string."""
        if kapp_string.startswith(":") and len(kapp_string) > 1:
            return self.prelude.get(kapp_string, None)
        elif len(kapp_string) == 1 or kapp_string == ":":
            # Create a self-named, self-inserting kapp for a single character
            return Kapp(name=kapp_string)
        else:
            # If it's not a single character or a known command, it's an error
            return None

    def exit_with_error(self, message: str):
        """Exits the app with an error message."""
        self.text_area.insert(f"Error: {message}")
        self.exit(message)


app = KeykappApp()

if __name__ == "__main__":
    app.run()
