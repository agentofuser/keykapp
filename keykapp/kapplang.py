import os
import pytest
from eventsourcing.domain import Aggregate, event
from eventsourcing.application import Application


class Stack(Aggregate):
    @event("created")
    def __init__(self):
        self.items = []

    @event("kapp_push")
    def push(self, item):
        self.items.append(item)

    @event("kapp_pop")
    def pop(self):
        if self.items:
            self.items.pop()

    @event("kapp_dup")
    def dup(self):
        if self.items:
            self.items.append(self.items[-1])

    @event("kapp_swap")
    def swap(self):
        if len(self.items) >= 2:
            self.items[-1], self.items[-2] = self.items[-2], self.items[-1]

    @event("kapp_zero")
    def zero(self):
        self.items.append(0)

    @event("kapp_succ")
    def succ(self):
        if self.items:
            self.items.append(self.items.pop() + 1)

    @event("kapp_pred")
    def pred(self):
        if self.items:
            self.items.append(self.items.pop() - 1)

    @event("kapp_add")
    def add(self):
        if len(self.items) >= 2:
            a = self.items.pop()
            b = self.items.pop()
            self.items.append(b + a)

    @event("kapp_sub")
    def sub(self):
        if len(self.items) >= 2:
            a = self.items.pop()
            b = self.items.pop()
            self.items.append(b - a)

    @event("kapp_mul")
    def mul(self):
        if len(self.items) >= 2:
            a = self.items.pop()
            b = self.items.pop()
            self.items.append(b * a)

    @event("kapp_div")
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

    def push_zero(self, stack_id):
        stack = self.repository.get(stack_id)
        stack.zero()
        self.save(stack)

    def pop(self, stack_id):
        stack = self.repository.get(stack_id)
        stack.pop()
        self.save(stack)

    def dup(self, stack_id):
        stack = self.repository.get(stack_id)
        stack.dup()
        self.save(stack)

    def swap(self, stack_id):
        stack = self.repository.get(stack_id)
        stack.swap()
        self.save(stack)

    def succ(self, stack_id):
        stack = self.repository.get(stack_id)
        stack.succ()
        self.save(stack)

    def pred(self, stack_id):
        stack = self.repository.get(stack_id)
        stack.pred()
        self.save(stack)

    def add(self, stack_id):
        stack = self.repository.get(stack_id)
        stack.add()
        self.save(stack)

    def sub(self, stack_id):
        stack = self.repository.get(stack_id)
        stack.sub()
        self.save(stack)

    def mul(self, stack_id):
        stack = self.repository.get(stack_id)
        stack.mul()
        self.save(stack)

    def div(self, stack_id):
        stack = self.repository.get(stack_id)
        stack.div()
        self.save(stack)

    def push_int(self, stack_id, value):
        stack = self.repository.get(stack_id)
        stack.zero()
        self.save(stack)
        if value > 0:
            for _ in range(value):
                stack.succ()
        elif value < 0:
            for _ in range(-value):
                stack.pred()
        self.save(stack)

    def get_stack(self, stack_id):
        stack = self.repository.get(stack_id)
        return stack.items

    def get_event_log(self):
        notifications = self.notification_log.select(start=1, limit=10)
        return [
            (n.id, n.originator_id, n.originator_version, str(n))
            for n in notifications
        ]


@pytest.fixture(scope="module")
def app():
    os.environ["PERSISTENCE_MODULE"] = "eventsourcing.sqlite"
    os.environ["SQLITE_DBNAME"] = "keykapp-dev.db"
    return KapplangApp()


@pytest.fixture
def stack_id(app):
    return app.create_stack()


def test_push_zero(app, stack_id):
    app.push_zero(stack_id)
    assert app.get_stack(stack_id) == [0]

    app.push_zero(stack_id)
    assert app.get_stack(stack_id) == [0, 0]


def test_dup(app, stack_id):
    app.push_int(stack_id, 1)
    app.dup(stack_id)
    assert app.get_stack(stack_id) == [1, 1]


def test_swap(app, stack_id):
    app.push_int(stack_id, 1)
    app.push_int(stack_id, 2)
    app.swap(stack_id)
    assert app.get_stack(stack_id) == [2, 1]


def test_succ(app, stack_id):
    app.push_int(stack_id, 0)
    app.succ(stack_id)
    assert app.get_stack(stack_id) == [1]


def test_pred(app, stack_id):
    app.push_int(stack_id, 0)
    app.pred(stack_id)
    assert app.get_stack(stack_id) == [-1]


def test_add(app, stack_id):
    app.push_int(stack_id, 1)
    app.push_int(stack_id, 2)
    app.add(stack_id)
    assert app.get_stack(stack_id) == [3]


def test_sub(app, stack_id):
    app.push_int(stack_id, 3)
    app.push_int(stack_id, 2)
    app.sub(stack_id)
    assert app.get_stack(stack_id) == [1]


def test_mul(app, stack_id):
    app.push_int(stack_id, 2)
    app.push_int(stack_id, 3)
    app.mul(stack_id)
    assert app.get_stack(stack_id) == [6]


def test_div(app, stack_id):
    app.push_int(stack_id, 6)
    app.push_int(stack_id, 2)
    app.div(stack_id)
    assert app.get_stack(stack_id) == [3]


if __name__ == "__main__":
    pytest.main()
