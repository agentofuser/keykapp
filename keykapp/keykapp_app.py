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

        # Initial rendering
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
            self.current_partial_arpeggio = []
            self.vm.dispatch(self.stack_id, kapp)
            self.generate_encoding_map()
            self.render_ui(kapp=kapp, partial_arpeggio=partial_arpeggio)
        else:
            is_valid_prefix = any(
                arpeggio[: len(partial_arpeggio)] == partial_arpeggio
                for arpeggio, (kapp, count) in self.encoding_map.items()
            )
            if not is_valid_prefix:
                self.render_log(f"Invalid prefix: {partial_arpeggio}")
            else:
                reachable_kapps_viz = " ".join(
                    [
                        f"{kapp}"
                        for kapp in self.get_reachable_kapps(partial_arpeggio)
                    ]
                )
                self.render_log(
                    f"{''.join(partial_arpeggio)}: {reachable_kapps_viz}"
                )

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
        for i, item in enumerate(stack):
            table.add_row(str(i), str(item))
        return table

    def format_kbd_viz(self):
        table = Table(title="Command Keyboard")
        table.add_column("Key", style="dim")
        table.add_column("Kapp")
        table.add_column("Count", justify="right")
        for arpeggio, (kapp, count) in self.encoding_map.items():
            table.add_row("".join(arpeggio), kapp, str(count))
        return table

    def render_log(self, message: str):
        self.query_one(RichLog).write(message)

    def render_frame(self, stack_viz, kbd_viz):
        self.render_log(stack_viz)
        self.render_log(kbd_viz)

    def render_ui(self, kapp=None, partial_arpeggio=None):
        if kapp and partial_arpeggio:
            self.render_log(
                f"\n{''.join(partial_arpeggio)}: {kapp}\n\n\n{'#' * 64}\n\n"
            )
        stack_viz = self.format_stack_viz()
        kbd_viz = self.format_kbd_viz()
        self.render_frame(stack_viz, kbd_viz)

    def compose(self) -> ComposeResult:
        yield VerticalScroll(RichLog())


if __name__ == "__main__":
    os.environ["PERSISTENCE_MODULE"] = "eventsourcing.sqlite"
    os.environ["SQLITE_DBNAME"] = "keykapp-dev.db"

    resume_flag = "--resume" in sys.argv
    app = KeykappApp(resume=resume_flag)
    app.run()
