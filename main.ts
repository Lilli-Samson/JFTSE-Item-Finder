import { makeCheckboxTree, TreeNode, getLeafStates, setLeafStates } from './checkboxTree';
import { createPopupLink, downloadItems, getResultsTable, Item, ItemSource, getMaxItemLevel, items, Character, characters, isCharacter, ShopItemSource, GachaItemSource, getGachaTable } from './itemLookup';
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
const dragSeparatorLine = createHTML(["hr", { id: "dragOverBar" }]);
let dragHighlightedElement: HTMLElement | undefined;

function applyDragDrop() {
    document.addEventListener("dragstart", ({ target }) => {
        if (!(target instanceof HTMLElement)) {
            return;
        }
        dragged = target;
    });

    document.addEventListener("dragover", (event) => {
        if (!(event.target instanceof HTMLElement)) {
            return;
        }
        if (event.target.className === "dropzone") {
            const targetRect = event.target.getBoundingClientRect();
            const y = event.clientY - targetRect.top;
            const height = targetRect.height;
            enum Position {
                above,
                on,
                below,
            }
            const position = y < height * 0.3 ? Position.above : y > height * 0.7 ? Position.below : Position.on;
            switch (position) {
                case Position.above:
                    if (dragHighlightedElement) {
                        dragHighlightedElement.classList.remove("drophover");
                        dragHighlightedElement = undefined;
                    }
                    dragSeparatorLine.hidden = false;
                    event.target.before(dragSeparatorLine);
                    break;
                case Position.below:
                    if (dragHighlightedElement) {
                        dragHighlightedElement.classList.remove("drophover");
                        dragHighlightedElement = undefined;
                    }
                    dragSeparatorLine.hidden = false;
                    event.target.after(dragSeparatorLine);
                    break;
                case Position.on:
                    dragSeparatorLine.hidden = true;
                    if (dragHighlightedElement) {
                        dragHighlightedElement.classList.remove("drophover");
                    }
                    if (dragged === event.target) {
                        break;
                    }
                    dragHighlightedElement = event.target;
                    dragHighlightedElement.classList.add("drophover");
                    break;
            }
        }
        event.preventDefault();
    });

    document.addEventListener("drop", ({ target }) => {
        if (!dragSeparatorLine.hidden) {
            dragged.remove();
            dragSeparatorLine.after(dragged);
            dragSeparatorLine.hidden = true;
            updateResults();
            return;
        }
        dragSeparatorLine.hidden = true;
        if (!(target instanceof HTMLElement)) {
            return;
        }
        if (dragHighlightedElement) {
            dragHighlightedElement.classList.remove("drophover");
            const dropTarget = dragHighlightedElement;
            dragHighlightedElement = undefined;
            if (!(dropTarget instanceof HTMLLIElement)) {
                return;
            }
            dropTarget.textContent += `+${dragged.textContent}`;
            dragged.remove();
        }
        if (target === dragged) {
            const stats = dragged.textContent!.split("+");
            dragged.textContent = stats.shift()!;
            dragged.after(...stats.map(stat => createHTML(["li", { class: "dropzone", draggable: "true" }, stat])));
        }
        updateResults();
    });
}

applyDragDrop();

function compare(lhs: number, rhs: number): -1 | 0 | 1 {
    if (lhs === rhs) {
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


export const itemSelectors = ["partsSelector", "gachaSelector", "otherItemsSelector"] as const;
export type ItemSelector = typeof itemSelectors[number];
export function isItemSelector(itemSelector: string): itemSelector is ItemSelector {
    return (itemSelectors as unknown as string[]).includes(itemSelector);
}

function getItemTypeSelection(): ItemSelector {
    const partsSelector = document.getElementById("partsSelector");
    if (!(partsSelector instanceof HTMLInputElement)) {
        throw "Internal error";
    }
    if (partsSelector.checked) {
        return "partsSelector";
    }
    const gachaSelector = document.getElementById("gachaSelector");
    if (!(gachaSelector instanceof HTMLInputElement)) {
        throw "Internal error";
    }
    if (gachaSelector.checked) {
        return "gachaSelector";
    }
    const otherItemsSelector = document.getElementById("otherItemsSelector");
    if (!(otherItemsSelector instanceof HTMLInputElement)) {
        throw "Internal error";
    }
    if (otherItemsSelector.checked) {
        return "otherItemsSelector";
    }
    throw "Internal error";
}

function saveSelection() {
    const selectedCharacter = getSelectedCharacter() || "All";
    Variable_storage.set_variable("Character", selectedCharacter);
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
        const enchantToggle = document.getElementById("enchantToggle");
        if (!(enchantToggle instanceof HTMLInputElement)) {
            throw "Internal error";
        }
        Variable_storage.set_variable("enchantToggle", enchantToggle.checked);
    }
    { //item selection
        Variable_storage.set_variable("itemTypeSelector", getItemTypeSelection());
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

        const enchantToggle = document.getElementById("enchantToggle");
        if (!(enchantToggle instanceof HTMLInputElement)) {
            throw "Internal error";
        }
        enchantToggle.checked = !!Variable_storage.get_variable("enchantToggle");
    }

    { //item selection
        let itemTypeSelector = Variable_storage.get_variable("itemTypeSelector");
        if (typeof itemTypeSelector !== "string" || !isItemSelector(itemTypeSelector)) {
            itemTypeSelector = "partsSelector";
        }
        const selector = document.getElementById(itemTypeSelector);
        if (!(selector instanceof HTMLInputElement)) {
            throw "Internal error";
        }
        selector.checked = true;
        selector.dispatchEvent(new Event("change", { bubbles: false, cancelable: true }));
    }

    const excluded_ids = Variable_storage.get_variable("excluded_item_ids");
    if (typeof excluded_ids === "string") {
        for (const id of excluded_ids.split(",")) {
            excluded_item_ids.add(parseInt(id));
        }
    }
    excluded_item_ids.delete(NaN);

    //must be last because it triggers a store
    levelrange.dispatchEvent(new Event("input"));
}

function updateResults() {
    saveSelection();
    const filters: ((item: Item) => boolean)[] = [];
    const sourceFilters: ((itemSource: ItemSource) => boolean)[] = [];
    let selectedCharacter: Character | undefined;
    const partsFilterList = document.getElementById("partsFilter")?.children[0];
    if (!(partsFilterList instanceof HTMLUListElement)) {
        throw "Internal error";
    }
    const enchantToggle = document.getElementById("enchantToggle");
    if (!(enchantToggle instanceof HTMLInputElement)) {
        throw "Internal error";
    }
    const namefilter = document.getElementById("nameFilter");
    if (!(namefilter instanceof HTMLInputElement)) {
        throw "Internal error";
    }

    { //character filter
        selectedCharacter = getSelectedCharacter();
        switch (getItemTypeSelection()) {
            case 'partsSelector':
                if (selectedCharacter) {
                    filters.push(item => item.character === selectedCharacter);
                }
                break;
            case 'gachaSelector':
                break;
            case 'otherItemsSelector':
                break;
        }
    }

    { //parts filter
        switch (getItemTypeSelection()) {
            case 'partsSelector':
                const partsStates = getLeafStates(partsFilterList);
                filters.push(item => partsStates[item.part]);
                break;
            case 'gachaSelector':
                break;
            case 'otherItemsSelector':
                break;
        }
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

    const priorityList = document.getElementById("priority_list");
    if (!(priorityList instanceof HTMLOListElement)) {
        throw "Internal error";
    }
    const priorityStats = Array
        .from(priorityList.childNodes)
        .filter(node => !node.textContent?.includes('\n'))
        .filter(node => node.textContent)
        .map(node => node.textContent!);
    {
        for (const stat of priorityStats) {
            const stats = stat.split("+");
            comparators.push((lhs: Item, rhs: Item) => compare(
                stats.map(stat => lhs.statFromString(stat)).reduce((n, m) => n + m),
                stats.map(stat => rhs.statFromString(stat)).reduce((n, m) => n + m)
            ));
        }
    }

    const table = (() => {
        switch (getItemTypeSelection()) {
            case 'partsSelector':
                return getResultsTable(
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
                    priorityStats,
                    selectedCharacter
                );
            case 'gachaSelector':
                return getGachaTable(item => filters.every(filter => filter(item)), selectedCharacter);
            case 'otherItemsSelector':
                return createHTML(
                    ["table",
                        ["tr",
                            ["th", "TODO: Other items"],
                        ]
                    ]
                );
        }
    })();

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

    const enchantToggle = document.getElementById("enchantToggle");
    if (!(enchantToggle instanceof HTMLInputElement)) {
        throw "Internal error";
    }
    const priorityList = document.getElementById("priority_list");
    if (!(priorityList instanceof HTMLOListElement)) {
        throw "Internal error";
    }
    enchantToggle.addEventListener("input", () => {
        const priorityStatNodes = Array
            .from(priorityList.childNodes)
            .filter(node => !node.textContent?.includes('\n'))
            .filter(node => node.textContent);

        for (const node of priorityStatNodes) {
            const regex = enchantToggle.checked ? /^((?:Str)|(?:Sta)|(?:Dex)|(?:Will))$/ : /^Max ((?:Str)|(?:Sta)|(?:Dex)|(?:Will))$/;
            const replacer = enchantToggle.checked ? "Max $1" : "$1";
            node.textContent = node.textContent!.split("+").map(s => s.replace(regex, replacer)).join("+");
        }
        updateResults();
    });
}

setDisplayUpdates();

function setItemTypeSelectorFunctionality() {
    const priority_group = document.getElementById("priority_group");
    if (!(priority_group instanceof HTMLFieldSetElement)) {
        return;
    }
    const partsSelector = document.getElementById("partsSelector");
    if (!(partsSelector instanceof HTMLInputElement)) {
        return;
    }
    const partsFilter = document.getElementById("partsFilter");
    if (!(partsFilter instanceof HTMLDivElement)) {
        return;
    }
    partsSelector.addEventListener("change", () => {
        priority_group.classList.remove("disabled");
        partsFilter.classList.remove("disabled");
        updateResults();
    });

    const gachaSelector = document.getElementById("gachaSelector");
    if (!(gachaSelector instanceof HTMLInputElement)) {
        return;
    }
    gachaSelector.addEventListener("change", () => {
        priority_group.classList.add("disabled");
        partsFilter.classList.add("disabled");
        updateResults();
    });

    const otherItemsSelector = document.getElementById("otherItemsSelector");
    if (!(otherItemsSelector instanceof HTMLInputElement)) {
        return;
    }
    otherItemsSelector.addEventListener("change", () => {
        priority_group.classList.add("disabled");
        partsFilter.classList.add("disabled");
        updateResults();
    });
}

window.addEventListener("load", async () => {
    setItemTypeSelectorFunctionality();
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
    const sort_help = document.getElementById("priority_legend");
    if (sort_help instanceof HTMLLegendElement) {
        sort_help.appendChild(createPopupLink(" (?)", createHTML(["p",
            "Reorder the stats to your liking to affect the results list.", ["br"],
            "Drag a stat up or down to change its importance (for example drag Lob above Charge).", ["br"],
            "Drag a stat onto another to combine them (for example Str onto Dex, the results will display Str+Dex).", ["br"],
            "Drag a combined stat onto itself to separate them."])));
    }
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