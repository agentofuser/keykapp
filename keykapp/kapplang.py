import os
import pytest
from eventsourcing.domain import Aggregate, event
from eventsourcing.application import Application
from eventsourcing.system import NotificationLogReader


class Stack(Aggregate):
    @event("create-applied")
    def __init__(self):
        self.items = []

    @event("push-applied")
    def push(self, item):
        self.items.append(item)

    @event("pop-applied")
    def pop(self):
        if self.items:
            self.items.pop()

    @event("dup-applied")
    def dup(self):
        if self.items:
            self.items.append(self.items[-1])

    @event("swap-applied")
    def swap(self):
        if len(self.items) >= 2:
            self.items[-1], self.items[-2] = self.items[-2], self.items[-1]

    @event("zero-applied")
    def zero(self):
        self.items.append(0)

    @event("succ-applied")
    def succ(self):
        if self.items:
            self.items.append(self.items.pop() + 1)

    @event("pred-applied")
    def pred(self):
        if self.items:
            self.items.append(self.items.pop() - 1)

    @event("add-applied")
    def add(self):
        if len(self.items) >= 2:
            a = self.items.pop()
            b = self.items.pop()
            self.items.append(b + a)

    @event("sub-applied")
    def sub(self):
        if len(self.items) >= 2:
            a = self.items.pop()
            b = self.items.pop()
            self.items.append(b - a)

    @event("mul-applied")
    def mul(self):
        if len(self.items) >= 2:
            a = self.items.pop()
            b = self.items.pop()
            self.items.append(b * a)

    @event("div-applied")
    def div(self):
        if len(self.items) >= 2:
            a = self.items.pop()
            b = self.items.pop()
            if a != 0:
                self.items.append(b // a)
            else:
                self.items.append(0)


class KapplangApp(Application):
    def create_stack(self):
        stack = Stack()
        self.save(stack)
        return stack.id

    def push_int(self, value):
        kapps = ["zero"]
        if value > 0:
            kapps.extend(["succ"] * value)
        elif value < 0:
            kapps.extend(["pred"] * -value)
        return kapps

    def get_stack(self, stack_id):
        stack = self.repository.get(stack_id)
        return stack.items

    def get_event_log(self, start=1):
        reader = NotificationLogReader(self.notification_log)
        return [
            (
                n.id,
                n.originator_id,
                n.originator_version,
                n.topic.split(".")[-1].replace("-applied", ""),
            )
            for n in reader.read(start=start)
        ]

    def dispatch(self, stack_id, kapp_name):
        stack = self.repository.get(stack_id)
        kapp_method = getattr(stack, kapp_name + "-applied", None)
        if kapp_method is None:
            raise ValueError(f"Kapp {kapp_name} not found")
        kapp_method()
        self.save(stack)


@pytest.fixture(scope="module")
def app():
    os.environ["PERSISTENCE_MODULE"] = "eventsourcing.sqlite"
    os.environ["SQLITE_DBNAME"] = "keykapp-test.db"
    return KapplangApp()


@pytest.fixture
def stack_id(app):
    return app.create_stack()


@pytest.fixture(scope="module", autouse=True)
def setup_and_teardown():
    # Setup: Ensure database is created
    db_path = "keykapp-test.db"
    if os.path.exists(db_path):
        os.remove(db_path)
    yield
    # Teardown: Ensure database is deleted
    if os.path.exists(db_path):
        os.remove(db_path)


def test_push_zero(app, stack_id):
    app.dispatch(stack_id, "zero")
    assert app.get_stack(stack_id) == [0]

    app.dispatch(stack_id, "zero")
    assert app.get_stack(stack_id) == [0, 0]


def test_dup(app, stack_id):
    for kapp in app.push_int(1):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "dup")
    assert app.get_stack(stack_id) == [1, 1]


def test_swap(app, stack_id):
    for kapp in app.push_int(1):
        app.dispatch(stack_id, kapp)
    for kapp in app.push_int(2):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "swap")
    assert app.get_stack(stack_id) == [2, 1]


def test_succ(app, stack_id):
    for kapp in app.push_int(0):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "succ")
    assert app.get_stack(stack_id) == [1]


def test_pred(app, stack_id):
    for kapp in app.push_int(0):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "pred")
    assert app.get_stack(stack_id) == [-1]


def test_add(app, stack_id):
    for kapp in app.push_int(1):
        app.dispatch(stack_id, kapp)
    for kapp in app.push_int(2):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "add")
    assert app.get_stack(stack_id) == [3]


def test_sub(app, stack_id):
    for kapp in app.push_int(3):
        app.dispatch(stack_id, kapp)
    for kapp in app.push_int(2):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "sub")
    assert app.get_stack(stack_id) == [1]


def test_mul(app, stack_id):
    for kapp in app.push_int(2):
        app.dispatch(stack_id, kapp)
    for kapp in app.push_int(3):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "mul")
    assert app.get_stack(stack_id) == [6]


def test_div(app, stack_id):
    for kapp in app.push_int(6):
        app.dispatch(stack_id, kapp)
    for kapp in app.push_int(2):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "div")
    assert app.get_stack(stack_id) == [3]


def test_event_log(app):
    start_log_length = len(app.get_event_log())
    stack_id = app.create_stack()
    kapps = app.push_int(1) + ["dup", "swap", "add"]
    for kapp in kapps:
        app.dispatch(stack_id, kapp)
    event_log = app.get_event_log(start=start_log_length + 1)
    expected_kapps = ["create"] + kapps
    actual_kapps = [event[3] for event in event_log]
    assert (
        actual_kapps == expected_kapps
    ), f"Expected {expected_kapps}, but got {actual_kapps}"


if __name__ == "__main__":
    pytest.main()
