import os
import random
from textual import events
from textual.app import App, ComposeResult
from textual.widgets import Static, RichLog
from huffman_arpeggio import (
    build_huffman_tree,
    generate_encoding_map_with_count,
)
from kapplang import KapplangApp
from rich import print


class KeykappApp(App):
    """Fleet cyborgism"""

    ENABLE_COMMAND_PALETTE = False

    KEYSWITCHES = ["j", "f", "k", "d", "l", "s"]

    def on_mount(self) -> None:
        self.vm = KapplangApp()
        self.stack_id = self.vm.create_stack()
        self.generate_encoding_map()
        self.current_partial_arpeggio = []

        # render stack
        stack = self.vm.get_stack(self.stack_id)
        stack_viz = f"{stack}"
        self.query_one(RichLog).write(stack_viz)
        # render command keyboard
        self.generate_encoding_map()

        kbd_viz = "\n".join(
            f"{''.join(arpeggio)}: {kapp} ({count})"
            for arpeggio, (kapp, count) in self.encoding_map.items()
        )
        self.query_one(RichLog).write(kbd_viz)

    def generate_encoding_map(self):
        kapp_counts = self.vm.get_kapp_counts()
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
            # handle arpeggio
            self.current_partial_arpeggio.append(event.key)
            partial_arpeggio = tuple(self.current_partial_arpeggio)
            kapp, _ = self.encoding_map.get(partial_arpeggio, (None, 0))

            if kapp:
                # reset arpeggio
                self.current_partial_arpeggio = []

                # render input and resolved kapp
                input_viz = f"{event.key}: {kapp}"
                self.query_one(RichLog).write(input_viz)

                self.vm.dispatch(self.stack_id, kapp)

                # render stack
                stack = self.vm.get_stack(self.stack_id)
                stack_viz = f"{stack}"
                self.query_one(RichLog).write(stack_viz)
                # render command keyboard
                self.generate_encoding_map()

                kbd_viz = "\n".join(
                    f"{''.join(arpeggio)}: {kapp} ({count})"
                    for arpeggio, (kapp, count) in self.encoding_map.items()
                )
                self.query_one(RichLog).write(kbd_viz)
            else:
                # check if partial arpeggio is a prefix of any full arpeggio
                is_valid_prefix = False
                for arpeggio, (kapp, count) in self.encoding_map.items():
                    if arpeggio[: len(partial_arpeggio)] == partial_arpeggio:
                        is_valid_prefix = True
                        break
                if not is_valid_prefix:
                    self.query_one(RichLog).write(
                        f"Invalid prefix: {partial_arpeggio}"
                    )
                    self.current_partial_arpeggio = []

    def compose(self) -> ComposeResult:
        yield RichLog()


if __name__ == "__main__":
    os.environ["PERSISTENCE_MODULE"] = "eventsourcing.sqlite"
    os.environ["SQLITE_DBNAME"] = "keykapp-dev.db"

    app = KeykappApp()
    app.run()
