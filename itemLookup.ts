import { type } from 'os';
import { createHTML } from './html';

const characters = ["Niki", "LunLun", "Lucy", "Shua", "Dhanpir", "Pochi", "Al"] as const;
export type Character = typeof characters[number];
function isCharacter(character: string): character is Character {
    return (characters as unknown as string[]).includes(character);
}

export type Part = "Hat" | "Hair" | "Dye" | "Upper" | "Lower" | "Shoes" | "Socks" | "Hand" | "Backpack" | "Face" | "Racket";

export class ItemSource {
    constructor(item_name: string, shop_id: number, price: number, ap: boolean = false, gacha_factor: number = 0) {
        this.item_name = item_name;
        this.shop_id = shop_id;
        this.price = price;
        if (ap) {
            this.price *= -1;
        }
        this.gacha_factor = gacha_factor;
    }
    display_string(): string {
        if (this.is_gacha) {
            let gf = this.gacha_factor.toFixed(1);
            if (gf.endsWith(".0")) {
                gf = gf.substring(0, gf.length - 2);
            }
            return `"${this.item_name}" x ${gf}`;
        }
        else if (this.is_guardian) {
            return this.item_name;
        }
        else {
            const currency = this.is_ap ? "AP" : "Gold";
            const price = Math.abs(this.price);
            return `${this.item_name ? `"${this.item_name}" ` : ""}Shop ${price} ${currency}${this.gacha_factor ? ` x ${this.gacha_factor} ≈ ${this.gacha_factor * price} ${currency}` : ""}`;
        }
    }
    get is_ap() {
        return this.price < 0;
    }
    get is_gold() {
        return this.price > 0;
    }
    get is_gacha() {
        return this.gacha_factor > 0;
    }
    get is_shop() {
        return this.gacha_factor = 0;
    }
    get is_guardian() {
        return this.gacha_factor < 0;
    }
    item_name: string;
    shop_id: number;
    price: number;
    gacha_factor: number;
}

export class Item {
    id = 0;
    name_kr = "";
    name_en = "";
    name_shop = "";
    useType = "";
    maxUse = 0;
    hidden = false;
    resist = "";
    character: Character = "Niki";
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
    constructor(shop_index: number, gacha_index: number, name: string) {
        this.shop_index = shop_index;
        this.gacha_index = gacha_index;
        this.name = name;
        for (const character of characters) {
            this.shop_items.set(character, new Map</*shop_id:*/ number, /*probability:*/ number>())
        }
    }

    add(shop_index: number, probability: number, character: Character) {
        this.shop_items.get(character)!.set(shop_index, probability);
        this.character_probability.set(character, probability + (this.character_probability.get(character) || 0));
    }

    average_tries(shop_index: number, character: Character | undefined = undefined) {
        const chars: readonly Character[] = character ? ([character]) : characters;
        const probability = chars.reduce((p, character) => p + (this.shop_items.get(character)!.get(shop_index) || 0), 0);
        if (probability === 0) {
            return 0;
        }
        const total_probability = chars.reduce((p, character) => p + this.character_probability.get(character)!, 0);
        return total_probability / probability;
    }

    shop_index: number;
    gacha_index: number;
    name: string;
    character_probability = new Map<Character, number>();
    shop_items = new Map<Character, Map</*shop_id:*/ number, /*probability:*/ number>>();
}

export let items = new Map<number, Item>();
export let shop_items = new Map<number, Item>();
let gachas: Gacha[] = [];

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
            gachas.push(new Gacha(index, parseInt(match.groups.item0), name));
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
        for (const itemID of itemIDs) {
            if (itemID === 0) {
                continue;
            }
            let oldItem = items.get(itemID);
            const newItem = new Item();
            newItem.name_en = match.groups.name_en ?? "";
            //todo: fill rest of item
            if (!oldItem) {
                oldItem = newItem;
            }
            if (category === "PARTS") {
                if (enabled) {
                    oldItem.sources.push(new ItemSource(name === newItem.name_en ? "" : name, index, price, price_type === "ap"));
                }
                shop_items.set(index, oldItem);
            }
            else {
                shop_items.set(index, newItem);
            }
        }
        count++;
    }
    console.log(`Found ${count} shop items`);
}

function parseGachaData(data: string, gacha: Gacha) {
    for (const match of data.matchAll(/<LotteryItem_(?<character>[^ ]*) Index="\d+" _Name_="[^"]*" ShopIndex="(?<shop_id>\d+)" QuantityMin="\d+" QuantityMax="\d+" ChansPer="(?<probability>\d+\.?\d*)" Effect="\d+" ProductOpt="\d+"\/>/g)) {
        if (!match.groups) {
            continue;
        }
        let character = match.groups.character;
        if (character === "Lunlun") {
            character = "LunLun";
        }
        if (!isCharacter(character)) {
            console.warn(`Found unknown character "${character} in lottery file ${gacha.gacha_index}`);
            continue;
        }
        gacha.add(parseInt(match.groups.shop_id), parseFloat(match.groups.probability), character);
    }
    for (const [character, map] of gacha.shop_items) {
        for (const [shop_id, probability] of map) {
            const item = shop_items.get(shop_id);
            if (!item) {
                console.warn(`Failed to find item ${shop_id} from "${gacha.name}" in shop`);
                continue;
            }
            item.sources.push(new ItemSource(gacha.name, shop_id, 0, false, gacha.average_tries(shop_id, character)));
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
            item.sources.push(new ItemSource(map_name, shop_id, 0, false, -1));
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
    console.log(`Found ${gachas.length} gachas`);
    for (const gacha of gachas) {
        const gacha_url = `${gachaSource}/Ini3_Lot_${`${gacha.gacha_index}`.padStart(2, "0")}.xml`;
        try {
            parseGachaData(await download(gacha_url, downloadCounter++, gachas.length + 3), gacha);
        } catch (e) {
            console.warn(`Failed downloading ${gacha_url} because ${e}`);
        }
    }
    console.log(`Loaded ${items.size} items`);
}

function deletableItem(name: string, id: number) {
    return createHTML(["div", createHTML(["button", { class: "item_removal", "data-item_index": `${id}` }, "X"]), name]);
}

function itemToTableRow(item: Item, sourceFilter: (itemSource: ItemSource) => boolean): HTMLTableRowElement {
    const row = createHTML(
        ["tr",
            ["td", { class: "Name_column" }, deletableItem(item.name_en, item.id)],
            ["td", { class: "ID_column numeric" }, `${item.id}`],
            ["td", { class: "Character_column" }, item.character],
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
            ["td", { class: "Source_column" }, item.sources.filter(sourceFilter).map(item => item.display_string()).join(", ")],
        ]
    );
    return row;
}

export function getResultsTable(filter: (item: Item) => boolean, sourceFilter: (itemSource: ItemSource) => boolean, priorizer: (items: Item[], item: Item) => Item[]): HTMLTableElement {
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
            statistics.characters.add(item.character)
            table.appendChild(itemToTableRow(item, sourceFilter));
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
