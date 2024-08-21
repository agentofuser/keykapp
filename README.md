# Keykapp

## Installation

```bash
git clone https://github.com/agentofuser/keykapp.git
cd keykapp
git checkout wip
```

If you don't have `pixi` installed, you can install it with the following command or check out other options at [pixi.sh](https://pixi.sh/):

```bash
curl -fsSL https://pixi.sh/install.sh | bash
```

## Usage

```bash
pixi run textual run keykapp/keykapp_app.py
```

## Possible next goals

- [ ] Show frequent kapp _sequences_ as a single command in the keyboard
  - [ ] Reify kapps as their own aggregate, with grounded kapps as leaves, and compound kapps as recursive lists of kapps
  - [ ] Use some dictionary compression algorithm to find frequent sequences of kapps without (or with less) double-counting of shorter sequences