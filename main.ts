import { makeCheckboxTree, TreeNode, getLeafStates, setLeafStates } from './checkboxTree';
import { downloadItems, getResultsTable, Item, ItemSource, getMaxItemLevel, items, Character, characters, isCharacter, ShopItemSource, GachaItemSource } from './itemLookup';
import { createHTML } from './html';
import { Variable_storage } from './storage';

const partsFilter = [
    "Parts", [
        "Head", [
            "+Hat",
            "+Hair",
            "Dye",
        ],
        "+Upper",
        "+Lower",
        "Legs", [
            "+Shoes",
            "Socks",
        ],
        "Aux", [
            "+Hand",
            "+Backpack",
            "+Face"
        ],
        "+Racket",
    ],
];

const availabilityFilter = [
    "Availability", [
        "Shop", [
            "+Gold",
            "+AP",
        ],
        "+Allow gacha",
        "+Guardian",
        "+Untradable",
        "Unavailable items",
    ],
];

const excluded_item_ids = new Set<number>();

function addFilterTrees() {
    const target = document.getElementById("characterFilters");
    if (!target) {
        return;
    }

    let first = true;
    for (const character of ["All", ...characters]) {
        const id = `characterSelectors_${character}`;
        const radio_button = createHTML(["input", { id: id, type: "radio", name: "characterSelectors", value: character }]);
        radio_button.addEventListener("input", updateResults);
        target.appendChild(radio_button);
        target.appendChild(createHTML(["label", { for: id }, character]));
        target.appendChild(createHTML(["br"]));
        if (first) {
            radio_button.checked = true;
            first = false;
        }
    }

    const filters: [TreeNode, string][] = [
        [partsFilter, "partsFilter"],
        [availabilityFilter, "availabilityFilter"],
    ];
    for (const [filter, name] of filters) {
        const target = document.getElementById(name);
        if (!target) {
            return;
        }
        const tree = makeCheckboxTree(filter);
        tree.addEventListener("change", updateResults);
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
            updateResults();
        }
    });
}

applyDragDrop();

function compare(lhs: number, rhs: number) {
    if (lhs == rhs) {
        return 0;
    }
    return lhs < rhs ? -1 : 1;
}

function getSelectedCharacter(): Character | undefined {
    const characterFilterList = document.getElementsByName("characterSelectors");
    for (const element of characterFilterList) {
        if (!(element instanceof HTMLInputElement)) {
            throw "Internal error";
        }
        if (element.checked) {
            const selection = element.value;
            if (isCharacter(selection)) {
                return selection;
            }
            return;
        }
    }
}

function setSelectedCharacter(character: Character | "All") {
    const characterFilterList = document.getElementsByName("characterSelectors");
    for (const element of characterFilterList) {
        if (!(element instanceof HTMLInputElement)) {
            throw "Internal error";
        }
        if (element.value === character) {
            element.checked = true;
            return;
        }
    }
}

function saveSelection() {
    const selected_character = getSelectedCharacter() || "All";
    Variable_storage.set_variable("Character", selected_character);
    {//Filters
        const partsFilterList = document.getElementById("partsFilter")?.children[0];
        if (!(partsFilterList instanceof HTMLUListElement)) {
            throw "Internal error";
        }
        for (const [name, value] of Object.entries(getLeafStates(partsFilterList))) {
            Variable_storage.set_variable(name, value);
        }
        const availabilityFilterList = document.getElementById("availabilityFilter")?.children[0];
        if (!(availabilityFilterList instanceof HTMLUListElement)) {
            throw "Internal error";
        }
        for (const [name, value] of Object.entries(getLeafStates(availabilityFilterList))) {
            Variable_storage.set_variable(name, value);
        }
    }
    { //misc
        const levelrange = document.getElementById("levelrange");
        if (!(levelrange instanceof HTMLInputElement)) {
            throw "Internal error";
        }
        const maxLevel = parseInt(levelrange.value);
        Variable_storage.set_variable("maxLevel", maxLevel);

        const namefilter = document.getElementById("nameFilter");
        if (!(namefilter instanceof HTMLInputElement)) {
            throw "Internal error";
        }
        const item_name = namefilter.value;
        if (item_name) {
            Variable_storage.set_variable("nameFilter", item_name);
        }
        else {
            Variable_storage.delete_variable("nameFilter");
        }
    }

    Variable_storage.set_variable("excluded_item_ids", Array.from(excluded_item_ids).join(","));
}

function restoreSelection() {
    const stored_character = Variable_storage.get_variable("Character");
    setSelectedCharacter(typeof stored_character === "string" && isCharacter(stored_character) ? stored_character : "All");

    {//Filters
        let states: { [key: string]: boolean } = {};
        for (const [name, value] of Object.entries(Variable_storage.variables)) {
            if (typeof value === "boolean") {
                states[name] = value;
            }
        }

        const partsFilterList = document.getElementById("partsFilter")?.children[0];
        if (!(partsFilterList instanceof HTMLUListElement)) {
            throw "Internal error";
        }
        setLeafStates(partsFilterList, states);
        const availabilityFilterList = document.getElementById("availabilityFilter")?.children[0];
        if (!(availabilityFilterList instanceof HTMLUListElement)) {
            throw "Internal error";
        }
        setLeafStates(availabilityFilterList, states);
    }
    const levelrange = document.getElementById("levelrange");
    { //misc
        if (!(levelrange instanceof HTMLInputElement)) {
            throw "Internal error";
        }
        const maxLevel = Variable_storage.get_variable("maxLevel");
        if (typeof maxLevel === "number") {
            levelrange.value = `${maxLevel}`;
        }
        else {
            levelrange.value = levelrange.max;
        }

        const namefilter = document.getElementById("nameFilter");
        if (!(namefilter instanceof HTMLInputElement)) {
            throw "Internal error";
        }
        const item_name = Variable_storage.get_variable("nameFilter");
        if (typeof item_name === "string") {
            namefilter.value = item_name;
        }

    }

    const excluded_ids = Variable_storage.get_variable("excluded_item_ids");
    if (typeof excluded_ids === "string") {
        for (const id of excluded_ids.split(",")) {
            excluded_item_ids.add(parseInt(id));
        }
    }
    excluded_item_ids.delete(NaN);

    //must be lasts because it triggers a store
    levelrange.dispatchEvent(new Event("input"));
}

function updateResults() {
    saveSelection();
    const filters: ((item: Item) => boolean)[] = [];
    const sourceFilters: ((itemSource: ItemSource) => boolean)[] = [];
    let selected_character: Character | undefined;

    { //character filter
        selected_character = getSelectedCharacter();
        if (selected_character) {
            filters.push(item => item.character === selected_character);
        }
    }

    { //parts filter
        const partsFilterList = document.getElementById("partsFilter")?.children[0];
        if (!(partsFilterList instanceof HTMLUListElement)) {
            throw "Internal error";
        }
        const partsStates = getLeafStates(partsFilterList);
        filters.push(item => partsStates[item.part]);
    }

    { //availability filter
        const availabilityFilterList = document.getElementById("availabilityFilter")?.children[0];
        if (!(availabilityFilterList instanceof HTMLUListElement)) {
            throw "Internal error";
        }
        const availabilityStates = getLeafStates(availabilityFilterList);
        if (!availabilityStates["Gold"]) {
            sourceFilters.push(itemSource => !(itemSource instanceof ShopItemSource && !itemSource.ap && itemSource.price > 0));
        }
        if (!availabilityStates["AP"]) {
            sourceFilters.push(itemSource => !(itemSource instanceof ShopItemSource && itemSource.ap && itemSource.price > 0));
        }
        if (!availabilityStates["Untradable"]) {
            filters.push(item => item.parcel_enabled);
        }
        if (!availabilityStates["Allow gacha"]) {
            sourceFilters.push(itemSource => !(itemSource instanceof GachaItemSource));
        }
        if (!availabilityStates["Guardian"]) {
            sourceFilters.push(itemSource => !itemSource.requiresGuardian);
        }
        if (!availabilityStates["Unavailable items"]) {
            const availabilitySourceFilter = [...sourceFilters];
            const sourceFilter = (itemSource: ItemSource) => availabilitySourceFilter.every(filter => filter(itemSource));
            function isAvailableSource(itemSource: ItemSource) {
                if (!sourceFilter(itemSource)) {
                    return false;
                }
                if (itemSource instanceof GachaItemSource) {
                    for (const source of itemSource.item.sources) {
                        if (isAvailableSource(source)) {
                            return true;
                        }
                    }
                }
                else {
                    return true;
                }
                return false;
            }
            sourceFilters.push(isAvailableSource);

            function isAvailableItem(item: Item): boolean {
                for (const itemSource of item.sources) {
                    if (isAvailableSource(itemSource)) {
                        return true;
                    }
                }
                return false;
            }
            filters.push(isAvailableItem);
        }
    }

    { //misc filter
        const levelrange = document.getElementById("levelrange");
        if (!(levelrange instanceof HTMLInputElement)) {
            throw "Internal error";
        }
        const maxLevel = parseInt(levelrange.value);
        filters.push((item: Item) => item.level <= maxLevel);

        const namefilter = document.getElementById("nameFilter");
        if (!(namefilter instanceof HTMLInputElement)) {
            throw "Internal error";
        }
        const item_name = namefilter.value;
        if (item_name) {
            filters.push(item => item.name_en.toLowerCase().includes(item_name.toLowerCase()));
        }
    }

    { //id filter
        filters.push(item => !excluded_item_ids.has(item.id));
        const itemFilterList = document.getElementById("itemFilter");
        if (!(itemFilterList instanceof HTMLDivElement)) {
            throw "Internal error";

        }
        itemFilterList.replaceChildren();
        for (const id of excluded_item_ids) {
            const item = items.get(id);
            if (!item) {
                continue;
            }
            itemFilterList.appendChild(createHTML(["div", createHTML(["button", { class: "item_removal_removal", "data-item_index": `${id}` }, "X"]), item.name_en]));
        }

    }

    const comparators: ((lhs: Item, rhs: Item) => number)[] = [];

    {
        const priorityList = document.getElementById("priority_list");
        if (!(priorityList instanceof HTMLOListElement)) {
            throw "Internal error";
        }
        const texts = Array.from(priorityList.childNodes).filter(node => !node.textContent?.includes('\n')).map(node => node.textContent);
        for (const text of texts) {
            switch (text) {
                case "Movement Speed":
                    comparators.push((lhs: Item, rhs: Item) => compare(lhs.movement, rhs.movement));
                    break;
                case "Charge":
                    comparators.push((lhs: Item, rhs: Item) => compare(lhs.charge, rhs.charge));
                    break;
                case "Lob":
                    comparators.push((lhs: Item, rhs: Item) => compare(lhs.lob, rhs.lob));
                    break;
                case "Str":
                    comparators.push((lhs: Item, rhs: Item) => compare(lhs.str, rhs.str));
                    break;
                case "Dex":
                    comparators.push((lhs: Item, rhs: Item) => compare(lhs.dex, rhs.dex));
                    break;
                case "Sta":
                    comparators.push((lhs: Item, rhs: Item) => compare(lhs.sta, rhs.sta));
                    break;
                case "Will":
                    comparators.push((lhs: Item, rhs: Item) => compare(lhs.wil, rhs.wil));
                    break;
                case "Serve":
                    comparators.push((lhs: Item, rhs: Item) => compare(lhs.serve, rhs.serve));
                    break;
                case "Quickslots":
                    comparators.push((lhs: Item, rhs: Item) => compare(lhs.quickslots, rhs.quickslots));
                    break;
                case "Buffslots":
                    comparators.push((lhs: Item, rhs: Item) => compare(lhs.buffslots, rhs.buffslots));
                    break;
                case "HP":
                    comparators.push((lhs: Item, rhs: Item) => compare(lhs.hp, rhs.hp));
                    break;
                //case "AP cost":
                //    comparators.push((lhs: Item, rhs: Item) => compare(lhs. , rhs.));
                //    break;
                //case "Gold cost":
                //    comparators.push((lhs: Item, rhs: Item) => compare(lhs. , rhs.));
                //    break;
            }
        }
    }

    const table = getResultsTable(
        item => filters.every(filter => filter(item)),
        itemSource => sourceFilters.every(filter => filter(itemSource)),
        (items, item) => {
            if (items.length === 0) {
                return [item];
            }
            for (const comparator of comparators) {
                switch (comparator(items[0], item)) {
                    case -1:
                        return [item];
                    case 1:
                        return items;
                }
            }
            return [...items, item];
        },
        selected_character
    );
    const target = document.getElementById("results");
    if (!target) {
        return;
    }
    target.innerText = "";
    target.appendChild(table);
}

function setMaxLevelDisplayUpdate() {
    const levelDisplay = document.getElementById("levelDisplay");
    if (!(levelDisplay instanceof HTMLLabelElement)) {
        throw "Internal error";
    }
    const levelrange = document.getElementById("levelrange");
    if (!(levelrange instanceof HTMLInputElement)) {
        throw "Internal error";
    }
    levelrange.addEventListener("input", () => {
        levelDisplay.textContent = `Max level requirement: ${levelrange.value}`;
        updateResults();
    });
}

function setDisplayUpdates() {
    setMaxLevelDisplayUpdate();
    const namefilter = document.getElementById("nameFilter");
    if (!(namefilter instanceof HTMLElement)) {
        throw "Internal error";
    }
    namefilter.addEventListener("input", updateResults);
}

setDisplayUpdates();

window.addEventListener("load", async () => {
    restoreSelection();
    await downloadItems();
    for (const element of document.getElementsByClassName("show_after_load")) {
        if (element instanceof HTMLElement) {
            element.hidden = false;
        }
    }
    for (const element of document.getElementsByClassName("hide_after_load")) {
        if (element instanceof HTMLElement) {
            element.style.display = "none";
        }
    }
    const levelrange = document.getElementById("levelrange");
    if (!(levelrange instanceof HTMLInputElement)) {
        throw "Internal error";
    }
    const maxLevel = getMaxItemLevel();
    levelrange.value = `${Math.min(parseInt(levelrange.value), maxLevel)}`;
    levelrange.max = `${maxLevel}`;
    levelrange.dispatchEvent(new Event("input"));
    updateResults();
});

document.body.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLElement)) {
        return;
    }
    if (event.target.className === "item_removal") {
        if (!event.target.dataset.item_index) {
            return;
        }
        excluded_item_ids.add(parseInt(event.target.dataset.item_index));
        updateResults();
    }
    else if (event.target.className === "item_removal_removal") {
        if (!event.target.dataset.item_index) {
            return;
        }
        excluded_item_ids.delete(parseInt(event.target.dataset.item_index));
        updateResults();
    }
});