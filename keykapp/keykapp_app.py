import os
import random
from textual import events
from textual.app import App, ComposeResult
from textual.widgets import Static
from huffman_arpeggio import (
    build_huffman_tree,
    generate_encoding_map_with_count,
)
from kapplang import KapplangApp
from rich import print


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

    vm = KapplangApp()
    stack = vm.create_stack()
    kapps = KapplangApp.GROUNDED_KAPPS

    # run a configurable N number of random kapps
    for _ in range(100):
        kapp = random.choice(kapps)
        vm.dispatch(stack, kapp)

    # get counts, build huffman tree, and generate encoding map
    kapp_counts = vm.get_kapp_counts()
    print(f"Kapp counts: {kapp_counts}")
    alphabet = ["j", "f", "k", "d", "l", "s"]
    root = build_huffman_tree(kapp_counts, alphabet)
    if root is None:
        raise ValueError("Huffman tree root is None")
    encoding_map = generate_encoding_map_with_count(
        root, alphabet, kapp_counts
    )

    # encoding map is Dict[Tuple[str, ...], Tuple[str, int]]
    # key is the arpeggio tuple, value is the kapp name and count
    # print encoding map, each line like:
    # {encoding tuple joined as string}\t{kapp name}\t{count}
    for arpeggio, (kapp, count) in encoding_map.items():
        print(f"{''.join(arpeggio)}\t{kapp}\t{count:03}")

    # example output:
    # Kapp counts: {'zero': 46, 'dup': 55, 'sub': 54, 'pop': 52, 'succ': 46, 'add': 53,
    # 'mul': 45, 'div': 52, 'pred': 53, 'swap': 44}
    # f       dup     055
    # k       sub     054
    # l       add     053
    # d       pred    053
    # s       pop     052
    # jj      div     052
    # jk      succ    046
    # jf      zero    046
    # jd      mul     045
    # jl      swap    044

    # app = KeykappApp()
    # app.run()
