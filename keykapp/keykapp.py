from textual.app import App, ComposeResult
from textual.widgets import Static

class KeykappApp(App):
    """fleet cyborgism"""

    ENABLE_COMMAND_PALETTE = False

    def compose(self) -> ComposeResult:
        yield StateViz(id="viz")
        yield CommandKeyboard(id="kbd")
    
class StateViz(Static):
    """pure function of state"""

    def on_mount(self) -> None:
        self.update("State Visualization")

class CommandKeyboard(Static):
    """grown-up command-palette"""

    def on_mount(self) -> None:
        self.update("Command Keyboard")
    
if __name__ == "__main__":
    app = KeykappApp()
    app.run()