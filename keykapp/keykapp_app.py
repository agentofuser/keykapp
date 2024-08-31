# keykapp_app.py

import asyncio
from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Callable
from textual.app import App, ComposeResult
from textual.widgets import TextArea


@dataclass
class Model:
    """Represents the state of the application."""

    kapp_history: List[str] = field(default_factory=list)


@dataclass
class Message:
    """Represents an event (either a character or a command)."""

    kapp: str


@dataclass
class Command:
    """Represents an effect to be performed."""

    action: Callable[[], None]


class KeykappApp(App):
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
        for kapp in kapps:
            # Convert the kapp to a message
            message = Message(kapp=kapp)
            # Update the model and get the command to execute
            model, command = self.update(model, message)

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
        self, model: Model, message: Message
    ) -> Tuple[Model, Optional[Command]]:
        """Update the model based on the message and return the new model and command."""
        new_model = Model(kapp_history=model.kapp_history + [message.kapp])

        if message.kapp.startswith(":"):  # It's a command
            if message.kapp == ":backspace":
                # Create a command for the backspace operation
                command = Command(
                    action=lambda: self.text_area.action_delete_left()
                )
                return new_model, command
        else:  # It's a character
            # Create a command to insert the character
            command = Command(
                action=lambda: self.text_area.insert(message.kapp)
            )
            return new_model, command

        # If no recognized command, return the model unchanged with no command
        return new_model, None


app = KeykappApp()

if __name__ == "__main__":
    app.run()
