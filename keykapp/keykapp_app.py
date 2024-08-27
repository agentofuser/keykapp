import os
import sys
from rich.table import Table
from textual import events
from textual.app import App, ComposeResult
from textual.containers import VerticalScroll
from textual.widgets import RichLog
from huffman_arpeggio import (
    build_huffman_tree,
    generate_encoding_map_with_count,
)
from kapplang import KapplangApp


class KeykappApp(App):
    """Fleet cyborgism"""

    CSS_PATH = "keykapp_app.tcss"
    ENABLE_COMMAND_PALETTE = False
    KEYSWITCHES = ["j", "f", "k", "d", "l", "s"]

    def __init__(self, resume=False, **kwargs):
        super().__init__(**kwargs)
        self.resume = resume

    def on_mount(self) -> None:
        self.vm = KapplangApp()

        # Resume the latest stack if --resume is passed, otherwise create a new one
        self.stack_id = (
            self.get_latest_stack_id()
            if self.resume
            else self.vm.create_stack()
        )

        self.generate_encoding_map()
        self.current_partial_arpeggio = []

        # Render initial state
        self.update_stack_viz()
        self.update_kbd_viz()

    def get_latest_stack_id(self):
        event_log = self.vm.get_event_log()
        create_events = [event for event in event_log if event[3] == "create"]
        if create_events:
            return create_events[-1][1]  # Return the last created stack ID
        else:
            return self.vm.create_stack()  # Create a new stack if none exist

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
            self.query_one(RichLog).write(f"Unknown key: {event.key}")
        else:
            self.current_partial_arpeggio.append(event.key)
            partial_arpeggio = tuple(self.current_partial_arpeggio)
            kapp, _ = self.encoding_map.get(partial_arpeggio, (None, 0))

            if kapp:
                # Clear the current partial arpeggio after a successful command
                self.current_partial_arpeggio = []

                # Print the whole arpeggio, not just the last key
                input_viz = f"\n{''.join(partial_arpeggio)}: {kapp}\n\n\n################################################################\n\n"
                self.query_one(RichLog).write(input_viz)

                # Dispatch the Kapp
                self.vm.dispatch(self.stack_id, kapp)

                # Update the encoding map and visualizations
                self.generate_encoding_map()
                self.update_stack_viz()
                self.update_kbd_viz()
            else:
                is_valid_prefix = False
                for arpeggio, (kapp, count) in self.encoding_map.items():
                    if arpeggio[: len(partial_arpeggio)] == partial_arpeggio:
                        is_valid_prefix = True
                        break
                if not is_valid_prefix:
                    self.query_one(RichLog).write(
                        f"Invalid prefix: {partial_arpeggio}"
                    )

    def update_stack_viz(self):
        stack = self.vm.get_stack(self.stack_id)
        table = Table(title="Current Stack")
        table.add_column("Index", style="dim", width=6)
        table.add_column("Value", justify="right")
        for i, item in enumerate(stack):
            table.add_row(str(i), str(item))
        self.query_one(RichLog).write(table)

    def update_kbd_viz(self):
        table = Table(title="Command Keyboard")
        table.add_column("Key", style="dim")
        table.add_column("Kapp")
        table.add_column("Count", justify="right")
        for arpeggio, (kapp, count) in self.encoding_map.items():
            table.add_row("".join(arpeggio), kapp, str(count))
        self.query_one(RichLog).write(table)

    def compose(self) -> ComposeResult:
        yield VerticalScroll(RichLog())


if __name__ == "__main__":
    os.environ["PERSISTENCE_MODULE"] = "eventsourcing.sqlite"
    os.environ["SQLITE_DBNAME"] = "keykapp-dev.db"

    resume_flag = "--resume" in sys.argv
    app = KeykappApp(resume=resume_flag)
    app.run()
