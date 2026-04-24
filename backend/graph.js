'use strict';

/**
 * graph.js — tree/cycle processing engine
 * Handles: validation, dedup, tree construction, cycle detection, depth
 */

const EDGE_RE = /^([A-Z])->([A-Z])$/;

function validateEntry(raw) {
  const s = raw.trim();
  // Must match X->Y, single uppercase letters, not A->A
  if (!EDGE_RE.test(s)) return null;
  const [, parent, child] = s.match(EDGE_RE);
  if (parent === child) return null; // self-loop = invalid
  return { parent, child, raw: s };
}

function processData(inputArray, identity) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdges = new Set();
  const validEdges = []; // [{parent, child}]

  for (const item of inputArray) {
    const parsed = validateEntry(item);
    if (!parsed) {
      invalidEntries.push(item.trim());
      continue;
    }
    const key = `${parsed.parent}->${parsed.child}`;
    if (seenEdges.has(key)) {
      // Only push to duplicates once, no matter how many repeats
      if (!duplicateEdges.includes(key)) duplicateEdges.push(key);
      continue;
    }
    seenEdges.add(key);
    validEdges.push({ parent: parsed.parent, child: parsed.child });
  }

  // Build adjacency: parent -> [children], track all nodes and who has parents
  const childrenOf = {}; // parent -> Set of children (first-parent-wins for child)
  const parentOf = {};   // child -> parent (first encounter wins)
  const allNodes = new Set();

  for (const { parent, child } of validEdges) {
    allNodes.add(parent);
    allNodes.add(child);

    // Diamond rule: first parent wins
    if (parentOf[child] !== undefined) {
      // child already has a parent — discard this edge silently
      continue;
    }
    parentOf[child] = parent;
    if (!childrenOf[parent]) childrenOf[parent] = [];
    childrenOf[parent].push(child);
  }

  // Find connected components via Union-Find
  const uf = makeUnionFind([...allNodes]);
  for (const { parent, child } of validEdges) {
    uf.union(parent, child);
  }

  // Group nodes by component root
  const components = {};
  for (const node of allNodes) {
    const rep = uf.find(node);
    if (!components[rep]) components[rep] = new Set();
    components[rep].add(node);
  }

  const hierarchies = [];

  for (const nodes of Object.values(components)) {
    const nodeList = [...nodes];

    // Detect cycle in this component (DFS)
    const hasCycle = detectCycle(nodeList, childrenOf);

    // Find roots: nodes that never appear as a child (within this component)
    const roots = nodeList.filter(n => parentOf[n] === undefined);

    let rootNode;
    if (hasCycle && roots.length === 0) {
      // Pure cycle — use lex smallest
      rootNode = nodeList.sort()[0];
    } else if (roots.length > 0) {
      rootNode = roots.sort()[0]; // lex smallest root
    } else {
      rootNode = nodeList.sort()[0];
    }

    if (hasCycle) {
      hierarchies.push({ root: rootNode, tree: {}, has_cycle: true });
    } else {
      const tree = buildTree(rootNode, childrenOf);
      const depth = calcDepth(tree, rootNode);
      hierarchies.push({ root: rootNode, tree, depth });
    }
  }

  // Sort hierarchies: non-cyclic first (by root lex), then cyclic
  hierarchies.sort((a, b) => {
    if (a.has_cycle && !b.has_cycle) return 1;
    if (!a.has_cycle && b.has_cycle) return -1;
    return a.root.localeCompare(b.root);
  });

  // Summary
  const nonCyclic = hierarchies.filter(h => !h.has_cycle);
  const cyclic = hierarchies.filter(h => h.has_cycle);

  let largestRoot = null;
  if (nonCyclic.length > 0) {
    nonCyclic.sort((a, b) => {
      if (b.depth !== a.depth) return b.depth - a.depth;
      return a.root.localeCompare(b.root); // lex tiebreak
    });
    largestRoot = nonCyclic[0].root;
  }

  return {
    user_id: identity.userId,
    email_id: identity.emailId,
    college_roll_number: identity.rollNumber,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: nonCyclic.length,
      total_cycles: cyclic.length,
      largest_tree_root: largestRoot || ''
    }
  };
}

// Recursive tree builder: { nodeName: { child1: {...}, child2: {...} } }
function buildTree(node, childrenOf) {
  const children = childrenOf[node] || [];
  const subtree = {};
  for (const child of children) {
    subtree[child] = buildTree(child, childrenOf)[child] || {};
  }
  return { [node]: subtree };
}

// Depth = longest path (node count) from root to leaf
function calcDepth(tree, node) {
  const children = Object.keys(tree[node] || {});
  if (children.length === 0) return 1;
  // Build subtrees to pass down
  const childDepths = children.map(c => calcDepth({ [c]: (tree[node] || {})[c] || {} }, c));
  return 1 + Math.max(...childDepths);
}

// DFS cycle detection on a set of nodes
function detectCycle(nodeList, childrenOf) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = {};
  for (const n of nodeList) color[n] = WHITE;

  function dfs(u) {
    color[u] = GRAY;
    for (const v of (childrenOf[u] || [])) {
      if (color[v] === undefined) continue; // outside component
      if (color[v] === GRAY) return true;   // back edge = cycle
      if (color[v] === WHITE && dfs(v)) return true;
    }
    color[u] = BLACK;
    return false;
  }

  for (const n of nodeList) {
    if (color[n] === WHITE && dfs(n)) return true;
  }
  return false;
}

// Simple Union-Find
function makeUnionFind(nodes) {
  const parent = {};
  const rank = {};
  for (const n of nodes) { parent[n] = n; rank[n] = 0; }

  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(a, b) {
    const ra = find(a), rb = find(b);
    if (ra === rb) return;
    if (rank[ra] < rank[rb]) parent[ra] = rb;
    else if (rank[ra] > rank[rb]) parent[rb] = ra;
    else { parent[rb] = ra; rank[ra]++; }
  }
  return { find, union };
}

module.exports = { processData };