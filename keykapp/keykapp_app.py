import os
import sys
from rich.table import Table
from rich.text import Text
from textual import events
from textual.app import App, ComposeResult
from textual.containers import VerticalScroll
from textual.widgets import RichLog
from huffman_arpeggio import (
    build_huffman_tree,
    generate_encoding_map_with_count,
)
from kapplang import KapplangApp
from collections import deque


def style_prefix_suffix(
    input_string: str, n: int, prefix_style: str, suffix_style: str
) -> Text:
    """
    Returns a Rich Text object with different styles for the first N characters and the rest.

    :param input_string: The string to be styled.
    :param n: The number of characters to apply the prefix style to.
    :param prefix_style: The style for the first N characters (e.g., "bold white").
    :param suffix_style: The style for the rest of the characters (e.g., "dim").
    :return: A Rich Text object that can be rendered.
    """
    rich_text = Text()
    prefix_part = input_string[:n]
    rich_text.append(prefix_part, style=prefix_style)
    suffix_part = input_string[n:]
    rich_text.append(suffix_part, style=suffix_style)
    return rich_text


class KeykappApp(App):
    """Fleet cyborgism"""

    CSS_PATH = "keykapp_app.tcss"
    ENABLE_COMMAND_PALETTE = False
    KEYSWITCHES = ["j", "f", "k", "d", "l", "s"]

    def __init__(self, resume=False, **kwargs):
        super().__init__(**kwargs)
        self.resume = resume
        self.message_queue = deque()  # Initialize the message queue

    def on_mount(self) -> None:
        self.vm = KapplangApp()
        self.stack_id = (
            self.get_latest_stack_id()
            if self.resume
            else self.vm.create_stack()
        )
        self.generate_encoding_map()
        self.current_partial_arpeggio = []
        self.render_ui()

    def get_latest_stack_id(self):
        event_log = self.vm.get_event_log()
        create_events = [event for event in event_log if event[3] == "create"]
        return (
            create_events[-1][1] if create_events else self.vm.create_stack()
        )

    def generate_encoding_map(self):
        kapp_counts = self.vm.get_kapp_counts()
        kapp_counts = self.vm.filter_kapp_counts_with_typechecking(
            self.stack_id, kapp_counts
        )
        root = build_huffman_tree(kapp_counts, self.KEYSWITCHES)
        if root is None:
            raise ValueError("Huffman tree root is None")
        self.encoding_map = generate_encoding_map_with_count(
            root, self.KEYSWITCHES, kapp_counts
        )

    def on_key(self, event: events.Key) -> None:
        if event.key not in self.KEYSWITCHES:
            self.render_log(f"Unknown key: {event.key}")
        else:
            self.handle_key_input(event.key)

    def handle_key_input(self, key: str) -> None:
        self.current_partial_arpeggio.append(key)
        partial_arpeggio = tuple(self.current_partial_arpeggio)
        kapp, _ = self.encoding_map.get(partial_arpeggio, (None, 0))

        if kapp:
            self.vm.dispatch(self.stack_id, kapp)
            self.generate_encoding_map()
            input_viz = f"{''.join(partial_arpeggio)}: {kapp}"
            self.message_queue.append(
                input_viz
            )  # Add input_viz to the message queue
            self.current_partial_arpeggio = []  # Reset the partial arpeggio after dispatch
            self.render_ui(
                kapp=kapp, partial_arpeggio=None
            )  # Use None to reset styling
        else:
            is_valid_prefix = any(
                arpeggio[: len(partial_arpeggio)] == partial_arpeggio
                for arpeggio, (kapp, count) in self.encoding_map.items()
            )
            if not is_valid_prefix:
                self.current_partial_arpeggio = []  # Reset on invalid input
                self.render_log(f"Invalid prefix: {''.join(partial_arpeggio)}")
            else:
                self.render_ui(partial_arpeggio=partial_arpeggio)

    def get_reachable_kapps(self, partial_arpeggio):
        reachable_kapps = [
            kapp
            for arpeggio, (kapp, count) in self.encoding_map.items()
            if arpeggio[: len(partial_arpeggio)] == partial_arpeggio
        ]
        kapp_counts = self.vm.get_kapp_counts()
        kapp_counts = self.vm.filter_kapp_counts_with_typechecking(
            self.stack_id, kapp_counts
        )
        return sorted(
            reachable_kapps,
            key=lambda kapp: kapp_counts.get(kapp, 0),
            reverse=True,
        )

    def format_stack_viz(self):
        stack = self.vm.get_stack(self.stack_id)
        table = Table(title="Current Stack")
        table.add_column("Index", style="dim", width=6)
        table.add_column("Value", justify="right")

        stack_length = len(stack)
        for i, item in enumerate(stack):
            # Inverted index calculation
            inverted_index = stack_length - 1 - i
            table.add_row(str(inverted_index), repr(item))

        return table

    def format_kbd_viz(self, partial_arpeggio=None):
        table = Table(title="Command Keyboard")
        table.add_column("Key")  # Remove default dim style from here
        table.add_column("Kapp")
        table.add_column("Count", justify="right")
        for arpeggio, (kapp, count) in self.encoding_map.items():
            arpeggio_str = "".join(arpeggio)
            if partial_arpeggio and arpeggio_str.startswith(
                "".join(partial_arpeggio)
            ):
                styled_arpeggio = style_prefix_suffix(
                    arpeggio_str,
                    len(partial_arpeggio),
                    prefix_style="bold white",
                    suffix_style="dim",
                )
            else:
                styled_arpeggio = style_prefix_suffix(
                    arpeggio_str, 0, prefix_style="dim", suffix_style="dim"
                )
            table.add_row(styled_arpeggio, kapp, str(count))
        return table

    def render_log(self, message: str):
        self.query_one(RichLog).write(message)

    def render_frame(self, stack_viz, kbd_viz):
        # Render the title at the top of the frame
        title = style_prefix_suffix(
            (" " * 30) + "KEYKAPP" + (" " * 30) + "\n", 33, "dim", "bold white"
        )
        self.render_log(title)

        # Render the message queue
        is_message_queue_empty = not self.message_queue
        while self.message_queue:
            message = (
                self.message_queue.popleft()
            )  # Print and remove each message
            self.render_log(message)
        self.render_log("\n") if not is_message_queue_empty else None

        # Render the stack and keyboard visualizations
        self.render_log(stack_viz)
        self.render_log(kbd_viz)

        # Render a separator line
        separator_line = "#" * 64
        self.render_log(separator_line)

    def render_ui(self, kapp=None, partial_arpeggio=None):
        if kapp and partial_arpeggio:
            input_viz = f"\n{''.join(partial_arpeggio)}: {kapp}\n\n"
            self.message_queue.append(
                input_viz
            )  # Queue the input visualization message
        stack_viz = self.format_stack_viz()
        kbd_viz = self.format_kbd_viz(partial_arpeggio)
        self.render_frame(stack_viz, kbd_viz)

    def compose(self) -> ComposeResult:
        yield VerticalScroll(RichLog())


if __name__ == "__main__":
    os.environ["PERSISTENCE_MODULE"] = "eventsourcing.sqlite"
    os.environ["SQLITE_DBNAME"] = "keykapp-dev.db"

    resume_flag = "--resume" in sys.argv
    app = KeykappApp(resume=resume_flag)
    app.run()
