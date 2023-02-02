import { createHTML } from './html';

export type TreeNode = string | TreeNode[];

function getChildren(node: HTMLInputElement): HTMLInputElement[] {
    const parent_li = node.parentElement;
    if (!(parent_li instanceof HTMLLIElement)) {
        return [];
    }
    const parent_ul = parent_li.parentElement;
    if (!(parent_ul instanceof HTMLUListElement)) {
        return [];
    }
    for (let childIndex = 0; childIndex < parent_ul.children.length; childIndex++) {
        if (parent_ul.children[childIndex] !== parent_li) {
            continue;
        }
        const potentialSiblingEntry = parent_ul.children[childIndex + 1]?.children[0];
        if (!(potentialSiblingEntry instanceof HTMLUListElement)) {
            break;
        }
        return Array
            .from(potentialSiblingEntry.children)
            .filter((e): e is HTMLLIElement => e instanceof HTMLLIElement && e.children[0] instanceof HTMLInputElement)
            .map(e => e.children[0] as HTMLInputElement);
    }
    return [];
}

function applyCheckedToDescendants(node: HTMLInputElement) {
    for (const child of getChildren(node)) {
        if (child.checked !== node.checked) {
            child.checked = node.checked;
            child.indeterminate = false;
            applyCheckedToDescendants(child);
        }
    }
}

function getParent(node: HTMLInputElement): HTMLInputElement | void {
    const parent_li = node.parentElement?.parentElement?.parentElement;
    if (!(parent_li instanceof HTMLLIElement)) {
        return;
    }
    const parent_ul = parent_li.parentElement;
    if (!(parent_ul instanceof HTMLUListElement)) {
        return;
    }
    let candidate: HTMLLIElement | void;
    for (const child of parent_ul.children) {
        if (child instanceof HTMLLIElement && child.children[0] instanceof HTMLInputElement) {
            candidate = child;
            continue;
        }
        if (child === parent_li && candidate) {
            return candidate.children[0] as HTMLInputElement;
        }
    }
}

function updateAncestors(node: HTMLInputElement) {
    const parent = getParent(node);
    if (!parent) {
        return;
    }
    let foundChecked = false;
    let foundUnchecked = false;
    let foundIndeterminate = false
    for (const child of getChildren(parent)) {
        if (child.checked) {
            foundChecked = true;
        }
        else {
            foundUnchecked = true;
        }
        if (child.indeterminate) {
            foundIndeterminate = true;
        }
    }
    if (foundIndeterminate || foundChecked && foundUnchecked) {
        parent.indeterminate = true;
    }
    else if (foundChecked) {
        parent.checked = true;
        parent.indeterminate = false;
    }
    else if (foundUnchecked) {
        parent.checked = false;
        parent.indeterminate = false;
    }
    updateAncestors(parent);
}

function applyCheckListener(node: HTMLInputElement) {
    node.addEventListener("change", e => {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        applyCheckedToDescendants(target);
        updateAncestors(target);
    });
}

function applyCheckListeners(node: HTMLUListElement) {
    for (const element of node.children) {
        if (element instanceof HTMLLIElement) {
            applyCheckListener(element.children[0] as HTMLInputElement);
        }
        else if (element instanceof HTMLUListElement) {
            applyCheckListeners(element);
        }
    }
}

function makeCheckboxTreeNode(treeNode: TreeNode): HTMLLIElement {
    if (typeof treeNode === "string") {
        let disabled = false;
        if (treeNode[0] === "-") {
            treeNode = treeNode.substring(1);
            disabled = true;
        }
        let checked = false;
        if (treeNode[0] === "+") {
            treeNode = treeNode.substring(1);
            checked = true;
        }

        const node = createHTML([
            "li",
            [
                "input",
                {
                    type: "checkbox",
                    id: treeNode.replaceAll(" ", "_"),
                    ...(checked && { checked: "checked" })
                }
            ],
            [
                "label",
                { for: treeNode.replaceAll(" ", "_") },
                treeNode
            ]
        ]);
        if (disabled) {
            node.classList.add("disabled");
        }
        return node;
    }
    else {
        const list = createHTML(["ul", { class: "checkbox" }]);
        for (let i = 0; i < treeNode.length; i++) {
            const node = treeNode[i];
            list.appendChild(makeCheckboxTreeNode(node));
        }
        return createHTML(["li", list]);
    }
}

export function makeCheckboxTree(treeNode: TreeNode) {
    let root = makeCheckboxTreeNode(treeNode).children[0];
    if (!(root instanceof HTMLUListElement)) {
        throw "Internal error";
    }
    applyCheckListeners(root);
    for (const leaf of getLeaves(root)) {
        updateAncestors(leaf);
    }
    return root;
}

function getLeaves(node: HTMLUListElement) {
    let result: HTMLInputElement[] = [];
    for (const element of node.children) {
        const input = element.children[0];
        if (input instanceof HTMLInputElement) {
            if (getChildren(input).length === 0) {
                result.push(input);
            }
        }
        else if (input instanceof HTMLUListElement) {
            result = result.concat(getLeaves(input));
        }
    }
    return result;
}

export function getLeafStates(node: HTMLUListElement) {
    let states: { [key: string]: boolean } = {};
    for (const leaf of getLeaves(node)) {
        states[leaf.id.replaceAll("_", " ")] = leaf.checked;
    }
    return states;
}