# keykapp_app.py

from textual.app import App, ComposeResult
from textual.widgets import TextArea


class KeykappApp(App):
    def compose(self) -> ComposeResult:
        # Create a TextArea widget
        text_area = TextArea()

        # Add the TextArea widget to the app's layout
        yield text_area


if __name__ == "__main__":
    # Run the app
    KeykappApp().run()
