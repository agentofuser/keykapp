# keykapp_app.py

import asyncio
from textual.app import App, ComposeResult
from textual.widgets import TextArea


class KeykappApp(App):
    def compose(self) -> ComposeResult:
        # Create a TextArea widget
        self.text_area = TextArea()

        # Add the TextArea widget to the app's layout
        yield self.text_area

    def on_mount(self) -> None:
        self.text_area.show_line_numbers = True
        # Start the typing animation on mount
        self.call_later(self.type_text)

    async def type_text(self) -> None:
        # Define the text to be typed out
        text = "Hello, worlds!"
        # Convert the text to a list of characters
        char_list = list(text)

        # Loop through each character in the list
        for char in char_list:
            # Append the character to the TextArea's content
            self.text_area.insert(char)
            # Wait for 0.1 seconds before typing the next character
            await asyncio.sleep(0.1)


app = KeykappApp()

if __name__ == "__main__":
    app.run()
