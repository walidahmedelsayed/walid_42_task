const fs = require("fs");

const allRows = fs.readFileSync("./big.txt").toString().split("\n");
const header = allRows.shift();
const columns = header.split("|");
const TOTAL = "$total";

const propertiesIndexes = columns
  .map((p, i) => [p, i])
  .filter(([p, i]) => /^property[0-9]+$/.test(p))
  .map(([p, i]) => i);

class HierarchyTree {
  constructor() {
    this.data = { children: {} };
  }

  addRow(row, getSortValueFn) {
    let splittedRow = row.split("|");
    let rowObj = {};
    for (let i = 0; i < columns.length; i++) {
      rowObj[columns[i]] = splittedRow[i];
    }

    let currNode = this.data;
    for (const propertyIndex of propertiesIndexes) {
      const nodeKey = splittedRow[propertyIndex];
      if (nodeKey === TOTAL) {
        currNode.value = parseFloat(getSortValueFn(rowObj));
        currNode.row = row;
        return;
      } else {
        if (!currNode.children[nodeKey]) {
          currNode.children[nodeKey] = { children: {} };
        }
        currNode = currNode.children[nodeKey];
      }
    }
    currNode.value = parseFloat(getSortValueFn(rowObj));
    currNode.row = row;
  }
}

const buildTree = (rows, getSortValueFn) => {
  const tree = new HierarchyTree();
  rows.forEach((sr) => tree.addRow(sr, getSortValueFn));
  return tree.data;
};

const reconstructTree = (root, path) => {
  if (root?.value !== undefined) {
    const currNode = root.row;
    return [
      currNode,
      ...Object.entries(root.children)
        .sort(([_, { value: value1 }], [_1, { value: value2 }]) => {
          return value2 - value1;
        })
        .flatMap(([key, childNode]) => {
          return reconstructTree(childNode, [...path, key]);
        }),
    ];
  }
  return [];
};

const hierarchicalSort = (rows, getSortValueFn) => {
  const tree = buildTree(rows, getSortValueFn);
  const sortedRows = reconstructTree(tree, []);
  sortedRows.unshift(header);
  fs.writeFileSync("./output.txt", sortedRows.join("\n"));
};

hierarchicalSort(allRows, (row) => row.net_sales);
