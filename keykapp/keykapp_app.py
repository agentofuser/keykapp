import os
from textual import events
from textual.app import App, ComposeResult
from textual.widgets import Static


class KeykappApp(App):
    """fleet cyborgism"""

    ENABLE_COMMAND_PALETTE = False

    def on_key(self, event: events.Key) -> None:
        # TODO
        return None

    def compose(self) -> ComposeResult:
        yield StateViz(id="viz")
        yield CommandKeyboard(id="kbd")


class StateViz(Static):
    """pure render of state"""

    def on_mount(self) -> None:
        self.update("State Visualization")


class CommandKeyboard(Static):
    """grown-up command-palette"""

    def on_mount(self) -> None:
        self.update("Command Keyboard")


if __name__ == "__main__":
    os.environ["PERSISTENCE_MODULE"] = "eventsourcing.sqlite"
    os.environ["SQLITE_DBNAME"] = "keykapp-dev.db"

    app = KeykappApp()
    app.run()
