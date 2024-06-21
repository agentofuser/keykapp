import json
from textual import events
from textual.app import App, ComposeResult
from textual.widgets import Static, RichLog
import libsql_experimental as libsql
import os
from dag_json import decode, encode, encoded_cid
from multiformats import CID
from dag_json import DagJsonEncoder

from merkle_sexp_db import MerkleSexpDB


class KeykappApp(App):
    """fleet cyborgism"""

    ENABLE_COMMAND_PALETTE = False

    def on_mount(self) -> None:
        self.db = MerkleSexpDB("keykapp-dev.db")

    def on_key(self, event: events.Key) -> None:
        self.db.insert_blob(str(event))
        state = self.db.get_all_sexps()

        viz = self.query_one(RichLog)
        viz.write(event)
        viz.write(state)

    def compose(self) -> ComposeResult:
        yield RichLog(id="viz")
        yield CommandKeyboard(id="kbd")


class CommandKeyboard(Static):
    """grown-up command-palette"""

    def on_mount(self) -> None:
        self.update("Command Keyboard")


if __name__ == "__main__":

    app = KeykappApp()
    app.run()
