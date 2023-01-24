import { createHTML } from './html';

type Filter = string | Filter[];

const characterFilters = [
    "Characters", [
        "Niki",
        "LunLun",
        "Lucy",
        "Shua",
        "Dhanpir",
        "Pochi",
        "Al",
    ],
];

const partsFilter = [
    "Parts", [
        "Head", [
            "Hat",
            "Hair",
            "Dye",
        ],
        "Upper",
        "Lower",
        "Shoes", [
            "Shoes",
            "Socks",
        ],
        "Aux", [
            "Hand",
            "Backpack",
            "Face"
        ],
        "Racket",
    ],
];

const availabilityFilter = [
    "Availability", [
        "Shop", [
            "Gold",
            "AP",
            "Allow gacha",
        ],
        "Guardian",
        "Parcel enabled",
        "Parcel disabled",
        "Exclude unavailable items",
    ],
];

function getName(node: HTMLInputElement): string | null | void {
    const parent = node.parentElement;
    if (!(parent instanceof HTMLUListElement)) {
        return "";
    }
    let found = false;
    for (const child of parent.children) {
        if (found) {
            return child.textContent;
        }
        if (child === node) {
            found = true;
        }
    }
}

function addFilterTreeNode(element: HTMLElement, filter: Filter) {
    if (typeof filter === "string") {
        element.appendChild(createHTML(["input", { type: "checkbox", id: filter, checked: "true" }]));
        element.appendChild(createHTML(["label", { for: filter }, filter]));
    }
    else {
        const list = createHTML(["ul"]);
        for (let i = 0; i < filter.length; i++) {
            const f = filter[i];
            const last = i === filter.length - 1;
            addFilterTreeNode(list, f);
            if (!last && typeof f === "string") {
                list.appendChild(createHTML(["br"]));
            }
        }
        element.appendChild(list);
    }
}

function makeFilterTree(filter: Filter) {
    const root = createHTML(["ul", { class: "treeview" }]);
    addFilterTreeNode(root, filter);
    return root;
}

function addFilterTrees() {
    const filters: [Filter, string][] = [
        [characterFilters, "characterFilters"],
        [partsFilter, "partsFilter"],
        [availabilityFilter, "availabilityFilter"],
    ];
    for (const [filter, name] of filters) {
        const target = document.getElementById(name);
        if (!target) {
            return;
        }
        target.innerText = "";
        target.appendChild(makeFilterTree(filter));
    }
}

addFilterTrees();

function getChildren(node: HTMLInputElement): HTMLInputElement[] {
    const parent = node.parentElement;
    if (!(parent instanceof HTMLUListElement)) {
        return [];
    }
    for (let childIndex = 0; childIndex < parent.children.length; childIndex++) {
        if (parent.children[childIndex] !== node) {
            continue;
        }
        const potentialSiblingList = parent.children[childIndex + 3];
        if (!(potentialSiblingList instanceof HTMLUListElement)) {
            break;
        }
        return Array.from(potentialSiblingList.children).filter(e => e instanceof HTMLInputElement) as HTMLInputElement[];
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
    const parentUL = node.parentElement;
    if (!(parentUL instanceof HTMLUListElement)) {
        return;
    }
    const grandparentUL = parentUL.parentElement;
    if (!(grandparentUL instanceof HTMLUListElement)) {
        return;
    }
    let candidate: HTMLInputElement | void;
    for (const child of grandparentUL.children) {
        if (child instanceof HTMLInputElement) {
            candidate = child;
            continue;
        }
        if (child === parentUL) {
            return candidate;
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

function applyCheckListeners() {
    const tree = document.querySelectorAll('input[type="checkbox"]');
    for (let node of tree) {
        if (!(node instanceof HTMLInputElement)) {
            return;
        }
        node.addEventListener("change", function (e) {
            const target = e.target;
            if (!(target instanceof HTMLInputElement)) {
                return;
            }
            applyCheckedToDescendants(target);
            updateAncestors(target);
        });
    }
}

applyCheckListeners();

let dragged: HTMLElement;

function applyDragDrop() {
    document.addEventListener("dragstart", ({ target }) => {
        if (!(target instanceof HTMLElement)) {
            return;
        }
        dragged = target;
    });

    document.addEventListener("dragover", (event) => {
        event.preventDefault();
    });

    document.addEventListener("drop", ({ target }) => {
        if (!(target instanceof HTMLElement)) {
            return;
        }
        if (target.className == "dropzone" && target !== dragged) {
            if (dragged.parentNode !== target.parentNode) { //disallow dragging across different lists
                return;
            }
            const list = Array.from(dragged.parentNode?.children ?? new HTMLCollection);
            const index = list.indexOf(dragged);
            dragged.remove();
            if (index > list.indexOf(target)) {
                target.before(dragged);
            } else {
                target.after(dragged);
            }
        }
    });
}

applyDragDrop();