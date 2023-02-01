import { createHTML } from './html';

const characters = ["Niki", "LunLun", "Lucy", "Shua", "Dhanpir", "Pochi", "Al"] as const;
export type Character = typeof characters[number];
function isCharacter(character: string): character is Character {
    return (characters as unknown as string[]).includes(character);
}

export type Part = "Hat" | "Hair" | "Dye" | "Upper" | "Lower" | "Shoes" | "Socks" | "Hand" | "Backpack" | "Face" | "Racket";

type ItemSourceType = "shop" | "set" | "gacha" | "guardian";

export class ItemSource {
    private constructor(
        readonly type: ItemSourceType,
        readonly shop_id: number,
        readonly price: number,
        readonly ap: boolean,
        readonly guardian_map: string = "",
        readonly items: Item[] = []) {
    }
    static forShop(shop_id: number, price: number, ap: boolean) {
        return new ItemSource("shop", shop_id, price, ap);
    }
    static forSet(shop_id: number, items: Item[]) {
        return new ItemSource("set", shop_id, 0, false, "", items);
    }
    static forGacha(shop_id: number) {
        return new ItemSource("gacha", shop_id, 0, false);
    }
    static forGuardian(guardian_map: string) {
        return new ItemSource("guardian", 0, 0, false, guardian_map);
    }
    get requiresAP() {
        return this.ap && !!this.price;
    }
    get requiresGold() {
        return !this.ap && !!this.price;
    }
    get requiresGuardian(): boolean {
        switch (this.type) {
            case "guardian":
                return true;
            case "shop":
                return false;
            case "gacha":
            case "set":
                return !this.item.sources.every(source => source.requiresGuardian);
        }
    }
    get is_parcel_enabled() {
        return this.item.parcel_enabled;
    }
    get item() {
        const item = shop_items.get(this.shop_id);
        if (!item) {
            console.error(`Failed finding item of itemSource ${this.shop_id}`);
            throw "Internal error";
        }
        return item;
    }
    gachaTries(item: Item, character?: Character) {
        const gacha = gachas.get(this.shop_id);
        if (!gacha) {
            throw "Internal error";
        }
        return gacha.average_tries(item, character);
    }
}

export class Item {
    id = 0;
    name_kr = "";
    name_en = "";
    useType = "";
    maxUse = 0;
    hidden = false;
    resist = "";
    character?: Character;
    part: Part = "Hat";
    level = 0;
    str = 0;
    sta = 0;
    dex = 0;
    wil = 0;
    hp = 0;
    quickslots = 0;
    buffslots = 0;
    smash = 0;
    movement = 0;
    charge = 0;
    lob = 0;
    serve = 0;
    max_str = 0;
    max_sta = 0;
    max_dex = 0;
    max_wil = 0;
    element_enchantable = false;
    parcel_enabled = false;
    parcel_from_shop = false;
    spin = 0;
    atss = 0;
    dfss = 0;
    socket = 0;
    gauge = 0;
    gauge_battle = 0;
    sources: ItemSource[] = []
}

class Gacha {
    constructor(readonly shop_index: number, readonly gacha_index: number, readonly name: string) {
        for (const character of characters) {
            this.shop_items.set(character, new Map<Item, /*probability:*/ number>())
        }
    }

    add(item: Item, probability: number, character: Character) {
        if (item.character && item.character !== character) {
            //console.info(`Item ${item.id} from gacha "${this.name}" ${this.gacha_index} has wrong character`);
            character = item.character;
        }
        this.shop_items.get(character)!.set(item, probability);
        this.character_probability.set(character, probability + (this.character_probability.get(character) || 0));
    }

    average_tries(item: Item, character: Character | undefined = undefined) {
        const chars: readonly Character[] = character ? ([character]) : characters;
        const probability = chars.reduce((p, character) => p + (this.shop_items.get(character)!.get(item) || 0), 0);
        if (probability === 0) {
            return 0;
        }
        const total_probability = chars.reduce((p, character) => p + this.character_probability.get(character)!, 0);
        return total_probability / probability;
    }

    character_probability = new Map<Character, number>();
    shop_items = new Map<Character, Map<Item, /*probability:*/ number>>();
}

export let items = new Map<number, Item>();
export let shop_items = new Map<number, Item>();
let gachas = new Map<number, Gacha>();
let dialog: HTMLDialogElement | undefined;

function prettyNumber(n: number, digits: number) {
    let s = n.toFixed(digits);
    while (s.endsWith("0")) {
        s = s.slice(0, -1);
    }
    if (s.endsWith(".")) {
        s = s.slice(0, -1);
    }
    return s;
}

function parseItemData(data: string) {
    if (data.length < 1000) {
        console.warn(`Items file is only ${data.length} bytes long`);
    }
    for (const [, result] of data.matchAll(/\<Item (.*)\/\>/g)) {
        const item: Item = new Item;
        for (const [, attribute, value] of result.matchAll(/\s?([^=]*)="([^"]*)"/g)) {
            switch (attribute) {
                case "Index":
                    item.id = parseInt(value);
                    break;
                case "_Name_":
                    item.name_kr = value;
                    break;
                case "Name_N":
                    item.name_en = value;
                    break;
                case "UseType":
                    item.useType = value;
                    break;
                case "MaxUse":
                    item.maxUse = parseInt(value);
                    break;
                case "Hide":
                    item.hidden = !!parseInt(value);
                    break;
                case "Resist":
                    item.resist = value;
                    break;
                case "Char":
                    switch (value) {
                        case "NIKI":
                            item.character = "Niki";
                            break;
                        case "LUNLUN":
                            item.character = "LunLun";
                            break;
                        case "LUCY":
                            item.character = "Lucy";
                            break;
                        case "SHUA":
                            item.character = "Shua";
                            break;
                        case "DHANPIR":
                            item.character = "Dhanpir";
                            break;
                        case "POCHI":
                            item.character = "Pochi";
                            break;
                        case "AL":
                            item.character = "Al";
                            break;
                        default:
                            console.warn(`Found unknown character "${value}"`);
                    }
                    break;
                case "Part":
                    switch (String(value)) {
                        case "BAG":
                            item.part = "Backpack";
                            break;
                        case "GLASSES":
                            item.part = "Face";
                            break;
                        case "HAND":
                            item.part = "Hand";
                            break;
                        case "SOCKS":
                            item.part = "Socks";
                            break;
                        case "FOOT":
                            item.part = "Shoes";
                            break;
                        case "CAP":
                            item.part = "Hat";
                            break;
                        case "PANTS":
                            item.part = "Lower";
                            break;
                        case "RACKET":
                            item.part = "Racket";
                            break;
                        case "BODY":
                            item.part = "Upper";
                            break;
                        case "HAIR":
                            item.part = "Hair";
                            break;
                        case "DYE":
                            item.part = "Dye";
                            break;
                        default:
                            console.warn(`Found unknown part ${value}`);
                    }
                    break;
                case "Level":
                    item.level = parseInt(value);
                    break;
                case "STR":
                    item.str = parseInt(value);
                    break;
                case "STA":
                    item.sta = parseInt(value);
                    break;
                case "DEX":
                    item.dex = parseInt(value);
                    break;
                case "WIL":
                    item.wil = parseInt(value);
                    break;
                case "AddHP":
                    item.hp = parseInt(value);
                    break;
                case "AddQuick":
                    item.quickslots = parseInt(value);
                    break;
                case "AddBuff":
                    item.buffslots = parseInt(value);
                    break;
                case "SmashSpeed":
                    item.smash = parseInt(value);
                    break;
                case "MoveSpeed":
                    item.movement = parseInt(value);
                    break;
                case "ChargeshotSpeed":
                    item.charge = parseInt(value);
                    break;
                case "LobSpeed":
                    item.lob = parseInt(value);
                    break;
                case "ServeSpeed":
                    item.serve = parseInt(value);
                    break;
                case "MAX_STR":
                    item.max_str = parseInt(value);
                    break;
                case "MAX_STA":
                    item.max_sta = parseInt(value);
                    break;
                case "MAX_DEX":
                    item.max_dex = parseInt(value);
                    break;
                case "MAX_WIL":
                    item.max_wil = parseInt(value);
                    break;
                case "EnchantElement":
                    item.element_enchantable = !!parseInt(value);
                    break;
                case "EnableParcel":
                    item.parcel_enabled = !!parseInt(value);
                    break;
                case "BallSpin":
                    item.spin = parseInt(value);
                    break;
                case "ATSS":
                    item.atss = parseInt(value);
                    break;
                case "DFSS":
                    item.dfss = parseInt(value);
                    break;
                case "Socket":
                    item.socket = parseInt(value);
                    break;
                case "Gauge":
                    item.gauge = parseInt(value);
                    break;
                case "GaugeBattle":
                    item.gauge_battle = parseInt(value);
                    break;
                default:
                    console.warn(`Found unknown item attribute "${attribute}"`);
            }
        }
        items.set(item.id, item);
    }
}

function parseShopData(data: string) {
    const debugShopParsing = false;
    if (data.length < 1000) {
        console.warn(`Shop file is only ${data.length} bytes long`);
    }
    let count = 0;
    let currentIndex = 0;
    for (const match of data.matchAll(/<Product DISPLAY="\d+" HIT_DISPLAY="\d+" Index="(?<index>\d+)" Enable="(?<enabled>0|1)" New="\d+" Hit="\d+" Free="\d+" Sale="\d+" Event="\d+" Couple="\d+" Nobuy="\d+" Rand="[^"]+" UseType="[^"]+" Use0="\d+" Use1="\d+" Use2="\d+" PriceType="(?<price_type>(?:MINT)|(?:GOLD))" OldPrice0="-?\d+" OldPrice1="-?\d+" OldPrice2="-?\d+" Price0="(?<price>-?\d+)" Price1="-?\d+" Price2="-?\d+" CouplePrice="-?\d+" Category="(?<category>[^"]*)" Name="(?<name>[^"]*)" GoldBack="-?\d+" EnableParcel="(?<parcel_from_shop>0|1)" Char="-?\d+" Item0="(?<item0>-?\d+)" Item1="(?<item1>-?\d+)" Item2="(?<item2>-?\d+)" Item3="(?<item3>-?\d+)" Item4="(?<item4>-?\d+)" Item5="(?<item5>-?\d+)" Item6="(?<item6>-?\d+)" Item7="(?<item7>-?\d+)" Item8="(?<item8>-?\d+)" Item9="(?<item9>-?\d+)" ?(?:Icon="[^"]*" ?)?(?:Name_kr="[^"]*" ?)?(?:Name_en="(?<name_en>[^"]*)" ?)?(?:Name_th="[^"]*" ?)?\/>/g)) {
        if (!match.groups) {
            continue;
        }
        const index = parseInt(match.groups.index);
        if (currentIndex + 1 !== index) {
            debugShopParsing && console.warn(`Failed parsing shop item index ${currentIndex + 2 === index ? currentIndex + 1 : `${currentIndex + 1} to ${index - 1}`}`);
        }
        currentIndex = index;
        const name = match.groups.name;
        const category = match.groups.category;
        if (category === "LOTTERY") {
            gachas.set(index, new Gacha(index, parseInt(match.groups.item0), name));
        }
        const enabled = !!parseInt(match.groups.enabled);
        const price_type: "ap" | "gold" | "none" = match.groups.price_type === "MINT" ? "ap" : match.groups.price_type === "GOLD" ? "gold" : "none";
        const price = parseInt(match.groups.price);
        const parcel_from_shop = !!parseInt(match.groups.parcel_from_shop);
        const itemIDs = [
            parseInt(match.groups.item0),
            parseInt(match.groups.item1),
            parseInt(match.groups.item2),
            parseInt(match.groups.item3),
            parseInt(match.groups.item4),
            parseInt(match.groups.item5),
            parseInt(match.groups.item6),
            parseInt(match.groups.item7),
            parseInt(match.groups.item8),
            parseInt(match.groups.item9),
        ];

        const inner_items = itemIDs.filter(id => !!id && items.get(id)).map(id => items.get(id)!);

        if (category === "PARTS") {
            const itemSource = ItemSource.forShop(index, price, price_type === "ap");
            if (inner_items.length === 1) {
                shop_items.set(index, inner_items[0]);
                if (enabled) {
                    inner_items[0].sources.push(itemSource);
                }
            }
            else { //set item
                const setItem = new Item();
                setItem.name_en = match.groups.name_en || match.groups.name;
                shop_items.set(index, setItem);
                if (enabled) {
                    setItem.sources.push(itemSource);
                }
                const setSource = ItemSource.forSet(index, inner_items);
                for (const item of inner_items) {
                    item.sources.push(setSource);
                }
            }
        }
        else if (category === "LOTTERY") {
            const gachaItem = new Item();
            gachaItem.name_en = match.groups.name_en || match.groups.name;
            shop_items.set(index, gachaItem);
            if (enabled) {
                gachaItem.sources.push(ItemSource.forShop(index, price, price_type === "ap"));
            }
        }
        else {
            const otherItem = new Item();
            otherItem.name_en = match.groups.name_en || match.groups.name;
            shop_items.set(index, otherItem);
        }
        count++;
    }
    console.log(`Found ${count} shop items`);
}

function parseGachaData(data: string, gacha: Gacha) {
    for (const line of data.split("\n")) {
        if (!line.includes("<LotteryItem_")) {
            continue;
        }
        const match = line.match(/\s*<LotteryItem_(?<character>[^ ]*) Index="\d+" _Name_="[^"]*" ShopIndex="(?<shop_id>\d+)" QuantityMin="\d+" QuantityMax="\d+" ChansPer="(?<probability>\d+\.?\d*)\s*" Effect="\d+" ProductOpt="\d+"\/>/);
        if (!match) {
            console.warn(`Failed parsing gacha ${gacha.gacha_index}:\n${line}`);
            continue;
        }
        if (!match.groups) {
            continue;
        }
        let character = match.groups.character;
        if (character === "Lunlun") {
            character = "LunLun";
        }
        if (!isCharacter(character)) {
            console.warn(`Found unknown character "${character}" in lottery file ${gacha.gacha_index}`);
            continue;
        }
        const item = shop_items.get(parseInt(match.groups.shop_id));
        if (!item) {
            console.warn(`Found unknown shop item id ${match.groups.shop_id} in lottery file ${gacha.gacha_index}`);
            continue;
        }
        gacha.add(item, parseFloat(match.groups.probability), character);
    }
    for (const [, map] of gacha.shop_items) {
        for (const [item,] of map) {
            item.sources.push(ItemSource.forGacha(gacha.shop_index));
        }
    }
}

function parseGuardianData(data: string) {
    const guardianData = JSON.parse(data);
    if (!Array.isArray(guardianData)) {
        return;
    }
    for (const mapInfo of guardianData) {
        if (typeof mapInfo !== "object") {
            continue;
        }
        const map_name = mapInfo.Name;
        if (typeof map_name !== "string") {
            continue;
        }
        const rewards = mapInfo.Rewards;
        if (!Array.isArray(rewards)) {
            continue;
        }
        for (const shop_id of rewards) {
            if (typeof shop_id !== "number") {
                continue;
            }
            const item = shop_items.get(shop_id);
            if (!item) {
                continue;
            }
            item.sources.push(ItemSource.forGuardian(map_name));
        }
    }
}

async function download(url: string, value: number | undefined = undefined, max_value: number | undefined = undefined) {
    const filename = url.slice(url.lastIndexOf("/") + 1);
    const element = document.getElementById("loading");
    if (element instanceof HTMLElement) {
        element.textContent = `Loading ${filename}, please wait...`;
    }
    const progressbar = document.getElementById("progressbar");
    if (progressbar instanceof HTMLProgressElement) {
        if (value) {
            progressbar.value = value;
        }
        if (max_value) {
            progressbar.max = max_value;
        }
    }
    const reply = await fetch(url);
    if (!reply.ok) {
        return "";
    }
    return reply.text();
}

export async function downloadItems() {
    const itemSource = "https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/auth-server/src/main/resources/res";
    const gachaSource = "https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/game-server/src/main/resources/res/lottery";
    const guardianSource = "https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/emulator/src/main/resources/res/"
    let downloadCounter = 1;
    const itemURL = itemSource + "/Item_Parts_Ini3.xml";
    const itemData = await download(itemURL, downloadCounter++);
    const shopURL = itemSource + "/Shop_Ini3.xml";
    const shopData = await download(shopURL, downloadCounter++);
    const guardianURL = guardianSource + "/GuardianStages.json";
    const guardianData = await download(guardianURL, downloadCounter++);
    parseItemData(itemData);
    parseShopData(shopData);
    parseGuardianData(guardianData);
    console.log(`Found ${gachas.size} gachas`);
    for (const [, gacha] of gachas) {
        const gacha_url = `${gachaSource}/Ini3_Lot_${`${gacha.gacha_index}`.padStart(2, "0")}.xml`;
        try {
            parseGachaData(await download(gacha_url, downloadCounter++, gachas.size + 3), gacha);
        } catch (e) {
            console.warn(`Failed downloading ${gacha_url} because ${e}`);
        }
    }
    console.log(`Loaded ${items.size} items`);
}

function deletableItem(name: string, id: number) {
    return createHTML(["div", createHTML(["button", { class: "item_removal", "data-item_index": `${id}` }, "X"]), name]);
}

function createPopupLink(text: string, content: HTMLElement | string | (HTMLElement | string)[]) {
    const link = createHTML(["a", { class: "popup_link" }, text]);
    link.addEventListener("click", (e) => {
        if (!(e instanceof MouseEvent)) {
            return;
        }
        const top_div = document.getElementById("top_div");
        if (!(top_div instanceof HTMLDivElement)) {
            return;
        }
        e.stopPropagation();
        if (dialog) {
            dialog.close();
            dialog.remove();
        }
        dialog = Array.isArray(content) ? createHTML(["dialog", ...content]) : createHTML(["dialog", content]);

        top_div.appendChild(dialog);
        const width = 300;
        dialog.style.position = "absolute";
        dialog.style.top = `${e.pageY}px`;
        dialog.style.left = `${e.pageX - width}px`;
        dialog.show();
    });
    return link;
}

function createChancePopup(tries: number) {
    function probabilityAfterNTries(probability: number, tries: number) {
        return 1 - (Math.pow((1 - probability), tries));
    }

    const content = createHTML([
        "table",
        [
            "tr",
            ["th", "Number of gachas"],
            ["th", "Chance for item"],
        ],
    ]);
    for (const factor of [0.1, 0.5, 1, 2, 5, 10]) {
        const gachas = Math.round(tries * factor);
        if (gachas === 0) {
            continue;
        }
        content.appendChild(createHTML([
            "tr",
            ["td", { class: "numeric" }, `${gachas}`],
            ["td", { class: "numeric" }, `${(probabilityAfterNTries(1 / tries, gachas) * 100).toFixed(4)}%`],
        ]));
    }
    content.appendChild(createHTML(["tr"]));
    return createPopupLink(`${prettyNumber(tries, 2)}`, content);
}

function createGachaSourcePopup(item: Item, itemSource: ItemSource, character?: Character) {
    const content = createHTML([
        "table",
        [
            "tr",
            ["th", "Item"],
            ["th", "Average Tries"],
        ],
    ]);
    const gacha = gachas.get(itemSource.shop_id);
    if (!gacha) {
        throw "Internal error";
    }

    for (const char of character === undefined ? characters : [character]) {
        const gacha_items = gacha.shop_items.get(char);
        if (!gacha_items) {
            continue;
        }
        for (const [gacha_item,] of gacha_items) {
            content.appendChild(createHTML([
                "tr",
                item === gacha_item ? { class: "highlighted" } : "",
                ["td", gacha_item.name_en],
                ["td", { class: "numeric" }, `${prettyNumber(gacha.average_tries(gacha_item, character), 2)}`],
            ]));
        }
    }
    return createPopupLink(itemSource.item.name_en, [createHTML(["a", gacha.name]), content]);
}

function createSetSourcePopup(item: Item, itemSource: ItemSource) {
    const contentTable = createHTML(["table", ["tr", ["th", "Contents"]]]);
    for (const inner_item of itemSource.items) {
        contentTable.appendChild(createHTML(["tr", inner_item === item ? { class: "highlighted" } : "", ["td", inner_item.name_en]]));
    }
    return createPopupLink(itemSource.item.name_en, [createHTML(["a", itemSource.item.name_en, contentTable])]);
}

function makeSourcesList(elements: HTMLElement[]): (HTMLElement | string)[] {
    const result: (HTMLElement | string)[] = [];
    let first = true;
    for (const element of elements) {
        if (!first) {
            result.push(createHTML(["a", ", "]));
        }
        else {
            first = false;
        }
        result.push(element);
    }
    return result;
}

function sourceItemElement(item: Item, itemSource: ItemSource, character?: Character): HTMLAnchorElement {
    switch (itemSource.type) {
        case "gacha":
            const sources = itemSource.item.sources.map(s => sourceItemElement(itemSource.item, s, character));
            return createHTML(
                ["a",
                    createGachaSourcePopup(item, itemSource, character),
                    ["a", ` x `, createChancePopup(itemSource.gachaTries(item, character))],
                    sources.length === 0 ? "" : " from ",
                    ...makeSourcesList(sources),
                ]);
        case "shop":
            const price = `${itemSource.price} ${itemSource.ap ? "AP" : "Gold"}`;
            return createHTML(["a", `Shop ${price}`]);
        case "guardian":
            return createHTML(["a", itemSource.guardian_map]);
        case "set":
            const setSources = itemSource.item.sources.map(s => sourceItemElement(itemSource.item, s, character));
            return createHTML(
                ["a",
                    createSetSourcePopup(item, itemSource),
                    setSources.length === 0 ? "" : " from ",
                    ...makeSourcesList(setSources),
                ]);
    }
}

function itemToTableRow(item: Item, sourceFilter: (itemSource: ItemSource) => boolean, character?: Character): HTMLTableRowElement {
    const elements = item.sources.filter(sourceFilter).map(itemSource => sourceItemElement(item, itemSource, character));
    const row = createHTML(
        ["tr",
            ["td", { class: "Name_column" }, deletableItem(item.name_en, item.id)],
            ["td", { class: "ID_column numeric" }, `${item.id}`],
            ["td", { class: "Character_column" }, item.character ?? "All"],
            ["td", { class: "Part_column" }, item.part],
            ["td", { class: "Str_column numeric" }, `${item.str}`],
            ["td", { class: "Sta_column numeric" }, `${item.sta}`],
            ["td", { class: "Dex_column numeric" }, `${item.dex}`],
            ["td", { class: "Wil_column numeric" }, `${item.wil}`],
            ["td", { class: "Smash_column numeric" }, `${item.smash}`],
            ["td", { class: "Movement_column numeric" }, `${item.movement}`],
            ["td", { class: "Charge_column numeric" }, `${item.charge}`],
            ["td", { class: "Lob_column numeric" }, `${item.lob}`],
            ["td", { class: "Serve_column numeric" }, `${item.serve}`],
            ["td", { class: "HP_column numeric" }, `${item.hp}`],
            ["td", { class: "Level_column numeric" }, `${item.level}`],
            ["td", { class: "Source_column" }, ...makeSourcesList(elements)],
        ]
    );
    return row;
}

export function getResultsTable(filter: (item: Item) => boolean, sourceFilter: (itemSource: ItemSource) => boolean, priorizer: (items: Item[], item: Item) => Item[], character: string): HTMLTableElement {
    const results: { [key: string]: Item[] } = {
        "Hat": [],
        "Hair": [],
        "Dye": [],
        "Upper": [],
        "Lower": [],
        "Shoes": [],
        "Socks": [],
        "Hand": [],
        "Backpack": [],
        "Face": [],
        "Racket": [],
    };

    for (const [, item] of items) {
        if (filter(item)) {
            results[item.part] = priorizer(results[item.part], item);
        }
    }

    const table = createHTML(
        ["table",
            ["tr",
                ["th", { class: "Name_column" }, "Name"],
                ["th", { class: "ID_column numeric" }, "ID"],
                ["th", { class: "Character_column" }, "Character"],
                ["th", { class: "Part_column" }, "Part"],
                ["th", { class: "Str_column numeric" }, "Str"],
                ["th", { class: "Sta_column numeric" }, "Sta"],
                ["th", { class: "Dex_column numeric" }, "Dex"],
                ["th", { class: "Wil_column numeric" }, "Wil"],
                ["th", { class: "Smash_column numeric" }, "Smash"],
                ["th", { class: "Movement_column numeric" }, "Movement"],
                ["th", { class: "Charge_column numeric" }, "Charge"],
                ["th", { class: "Lob_column numeric" }, "Lob"],
                ["th", { class: "Serve_column numeric" }, "Serve"],
                ["th", { class: "HP_column numeric" }, "HP"],
                ["th", { class: "Level_column numeric" }, "Level"],
                ["th", { class: "Source_column" }, "Source"],
            ]
        ]
    );
    const statistics = {
        "characters": new Set<Character>,
        "Str": 0,
        "Sta": 0,
        "Dex": 0,
        "Wil": 0,
        "Smash": 0,
        "Movement": 0,
        "Charge": 0,
        "Lob": 0,
        "Serve": 0,
        "HP": 0,
        "Level": 0,
    };
    for (const result of Object.values(results)) {
        if (result.length === 0) {
            continue;
        }
        statistics.Str += result[0].str;
        statistics.Sta += result[0].sta;
        statistics.Dex += result[0].dex;
        statistics.Wil += result[0].wil;
        statistics.Smash += result[0].smash;
        statistics.Movement += result[0].movement;
        statistics.Charge += result[0].charge;
        statistics.Lob += result[0].lob;
        statistics.Serve += result[0].serve;
        statistics.HP += result[0].hp;
        statistics.Level = Math.max(result[0].level, statistics.Level);
        for (const item of result) {
            for (const char of item.character ? [item.character] : characters) {
                statistics.characters.add(char)
                table.appendChild(itemToTableRow(item, sourceFilter, isCharacter(character) ? character : undefined));
            }
        }
    }
    if (statistics.characters.size === 1) {
        table.appendChild(createHTML(
            ["tr",
                ["td", { class: "total Name_column" }, "Total:"],
                ["td", { class: "total ID_column numeric" }],
                ["td", { class: "total Character_column" }],
                ["td", { class: "total Part_column" }],
                ["td", { class: "total Str_column numeric" }, `${statistics.Str}`],
                ["td", { class: "total Sta_column numeric" }, `${statistics.Sta}`],
                ["td", { class: "total Dex_column numeric" }, `${statistics.Dex}`],
                ["td", { class: "total Wil_column numeric" }, `${statistics.Wil}`],
                ["td", { class: "total Smash_column numeric" }, `${statistics.Smash}`],
                ["td", { class: "total Movement_column numeric" }, `${statistics.Movement}`],
                ["td", { class: "total Charge_column numeric" }, `${statistics.Charge}`],
                ["td", { class: "total Lob_column numeric" }, `${statistics.Lob}`],
                ["td", { class: "total Serve_column numeric" }, `${statistics.Serve}`],
                ["td", { class: "total HP_column numeric" }, `${statistics.HP}`],
                ["td", { class: "total Level_column numeric" }, `${statistics.Level}`],
                ["td", { class: "total Source_column" }],
            ]
        ));
        for (const column_element of table.getElementsByClassName(`Character_column`)) {
            if (!(column_element instanceof HTMLElement)) {
                continue;
            }
            column_element.hidden = true;
        }
    }

    for (const attribute of ["Str", "Sta", "Dex", "Wil", "Smash", "Movement", "Charge", "Lob", "Serve", "HP",] as const) {
        if (statistics[attribute] === 0) {
            for (const column_element of table.getElementsByClassName(`${attribute}_column`)) {
                if (!(column_element instanceof HTMLElement)) {
                    continue;
                }
                column_element.hidden = true;
            }
        }
    }
    return table;
}

export function getMaxItemLevel() {
    //no reduce for Map?
    let max = 0;
    for (const [, item] of items) {
        max = Math.max(max, item.level);
    }
    return max;
}

document.body.addEventListener('click', (event) => {
    if (dialog && dialog !== event.target) {
        dialog.close();
        dialog.remove();
        dialog = undefined;
    }
});