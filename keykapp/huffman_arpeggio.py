from heapq import heappush, heappop, heapify
import math
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, field


@dataclass(order=True, frozen=True)
class Node:
    count: int
    target: Optional[str] = field(compare=False)
    children: List["Node"] = field(default_factory=list, compare=False)


def calculate_padding(num_elements: int, num_branches: int) -> Tuple[int, int]:
    """
    Calculate the number of padding nodes required for the Huffman tree.

    :param num_elements: The number of elements to encode.
    :param num_branches: The number of branches in the Huffman tree.
    :return: The number of branch points and the number of padding nodes required.
    """
    num_branch_points = math.ceil((num_elements - 1) / (num_branches - 1))
    num_padding = 1 + (num_branches - 1) * num_branch_points - num_elements
    return num_branch_points, num_padding


def merge_nodes(nodes: List[Node], num_branches: int) -> Optional[Node]:
    """
    Merge nodes to form the Huffman tree.

    :param nodes: A list of Node instances.
    :param num_branches: The number of branches in the Huffman tree.
    :return: The root of the Huffman tree.
    """
    heapify(nodes)

    while len(nodes) > 1:
        merged_count = 0
        merged_children = []

        for _ in range(min(num_branches, len(nodes))):
            node = heappop(nodes)
            merged_count += node.count
            merged_children.append(node)

        merged_node = Node(merged_count, None, merged_children)
        heappush(nodes, merged_node)

    return nodes[0] if nodes else None


def build_huffman_tree(
    count_dict: Dict[str, int], symbols: List[str]
) -> Optional[Node]:
    """
    Build the Huffman tree.

    :param count_dict: A dictionary mapping targets to their counts.
    :param symbols: A list of symbols used in the encoding.
    :return: The root of the Huffman tree.
    :raises ValueError: If symbols are not unique or if inputs are invalid.
    """
    if not count_dict:
        raise ValueError("count_dict must not be empty")
    if not symbols:
        raise ValueError("symbols must not be empty")
    if len(symbols) != len(set(symbols)):
        raise ValueError(
            "Symbols must be unique to ensure a prefix-free encoding"
        )

    num_elements = len(count_dict)
    num_branches = len(symbols)

    num_branch_points, num_padding = calculate_padding(
        num_elements, num_branches
    )

    nodes = [Node(count, target) for target, count in count_dict.items()]

    for _ in range(num_padding):
        nodes.append(Node(0, None))

    root = merge_nodes(nodes, num_branches)

    return root


def generate_encoding_map_with_count(
    root: Node, symbols: List[str], count_dict: Dict[str, int]
) -> Dict[Tuple[str, ...], Tuple[str, int]]:
    """
    Generate an encoding map with targets and counts.

    :param root: The root of the Huffman tree.
    :param symbols: A list of symbols used in the encoding.
    :param count_dict: A dictionary mapping targets to their counts.
    :return: An encoding map with targets and counts.
    """

    # HACK: copy and reverse the symbols list to use its order as a preference
    # ranking for the encoding map, making the first symbol in the list go to
    # the highest count node at that level, and so forth
    sorted_symbols = symbols.copy()
    sorted_symbols.reverse()

    def traverse(
        node: Node,
        path: List[str],
        encoding_map: Dict[Tuple[str, ...], Tuple[str, int]],
    ):
        if node.target is not None:
            encoding_map[tuple(path)] = (node.target, count_dict[node.target])
        for i, child in enumerate(node.children):
            traverse(child, path + [sorted_symbols[i]], encoding_map)

    encoding_map = {}
    traverse(root, [], encoding_map)
    return encoding_map
