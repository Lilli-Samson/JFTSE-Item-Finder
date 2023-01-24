import { makeCheckboxTree, TreeNode, getLeafStates } from './checkboxTree';
import { downloadItems, getResultsTable, Item } from './itemLookup';

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

function addFilterTrees() {
    const filters: [TreeNode, string][] = [
        [characterFilters, "characterFilters"],
        [partsFilter, "partsFilter"],
        [availabilityFilter, "availabilityFilter"],
    ];
    for (const [filter, name] of filters) {
        const target = document.getElementById(name);
        if (!target) {
            return;
        }
        const tree = makeCheckboxTree(filter);
        tree.addEventListener("change", () => updateResults());
        target.innerText = "";
        target.appendChild(tree);
    }
}

addFilterTrees();

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

downloadItems().then(() => {
    const element = document.getElementById("loading");
    if (element) {
        element.hidden = true;
    }

    for (const name of ["filter group", "priority group", "results group"]) {
        const element = document.getElementById(name);
        if (element) {
            element.hidden = false;
        }
    }

    updateResults();
});

function updateResults() {
    const filters: ((item: Item) => boolean)[] = [];

    {
        const characterFilterList = document.getElementById("characterFilters")?.children[0];
        if (!(characterFilterList instanceof HTMLUListElement)) {
            throw "Internal error";
        }
        const characterStates = getLeafStates(characterFilterList);
        filters.push((item: Item): boolean => {
            return characterStates[item.character];
        });
    }

    {
        const partsFilterList = document.getElementById("partsFilter")?.children[0];
        if (!(partsFilterList instanceof HTMLUListElement)) {
            throw "Internal error";
        }
        const partsStates = getLeafStates(partsFilterList);
        filters.push((item: Item): boolean => {
            return partsStates[item.part];
        });
    }

    const table = getResultsTable(item => filters.every(filter => filter(item)), items => items.slice(0, 3));
    const target = document.getElementById("results");
    if (!target) {
        return;
    }
    target.innerText = "";
    target.appendChild(table);
}