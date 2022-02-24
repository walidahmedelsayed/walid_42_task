const fs = require("fs");

const allRows = fs.readFileSync("./big.txt").toString().split("\n");
const header = allRows.shift();
const columns = header.split("|");
const TOTAL = "$total";
const ROW_SEPARATOR = "|";
const propertiesIndexes = columns
  .map((c, i) => [c, i])
  .filter(([c, i]) => c.match(/property[\d]/))
  .map(([c, i]) => i);

class Row {
  constructor(rowData, getSortValueFn) {
    this.data = rowData;
    this.splitted = rowData.split(ROW_SEPARATOR);
    for (let i = 0; i < this.splitted.length; i++) {
      this[columns[i]] = this.splitted[i];
    }
    this.value = +getSortValueFn(this);
  }
}

class Tree {
  constructor() {
    this.data = { nodes: {} };
  }

  insertNode(row) {
    let currNode = this.data;
    for (const index of propertiesIndexes) {
      const nodeKey = row.splitted[index];
      if (nodeKey === TOTAL) {
        currNode.value = row.value;
        currNode.row = row.data;
        return;
      } else {
        if (!currNode.nodes[nodeKey]) {
          currNode.nodes[nodeKey] = { nodes: {} };
        }
        currNode = currNode.nodes[nodeKey];
      }
    }
    currNode.value = row.value;
    currNode.row = row.data;
  }
}

const getSortedRows = (root) => {
  if (root.nodes) {
    let sortedRows = [];
    const sortedNodes = Object.values(root.nodes).sort(
      (nodeA, nodeB) => nodeB.value - nodeA.value
    );
    for (const node of sortedNodes) {
      sortedRows.push(getSortedRows(node));
    }
    return [root.row, ...sortedRows.flatMap((x) => x)];
  }
  return [];
};

const hierarchicalSort = (rows, getSortValueFn) => {
  const tree = new Tree();
  for (const row of rows) {
    const r = new Row(row, getSortValueFn);
    tree.insertNode(r);
  }
  const sortedRows = getSortedRows(tree.data);
  sortedRows.unshift(header);
  fs.writeFileSync("./output.txt", sortedRows.join("\n"));
};

hierarchicalSort(allRows, (row) => row.net_sales);
