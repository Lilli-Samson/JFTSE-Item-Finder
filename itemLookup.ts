import { createHTML } from './html';

export type Character = "Niki" | "LunLun" | "Lucy" | "Shua" | "Dhanpir" | "Pochi" | "Al";

export type Part = "Hat" | "Hair" | "Dye" | "Upper" | "Lower" | "Shoes" | "Socks" | "Hand" | "Backpack" | "Face" | "Racket";

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
    spin = 0;
    atss = 0;
    dfss = 0;
    socket = 0;
    gauge = 0;
    gauge_battle = 0;
    price = 0;
    price_type: "ap" | "gold" | "none" = "none";
    available_in_shop = false;
}

let items = new Map<number, Item>();

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
    if (data.length < 1000) {
        console.warn(`Shop file is only ${data.length} bytes long`);
    }
    for (const [, result] of data.matchAll(/<Product (.*)\/>/g)) {
        let item: Item | undefined;
        for (const [, attribute, value] of result.matchAll(/([^=]*)="([^"]*)" /g)) {
            switch (attribute) {
                case "Index":
                    item = items.get(parseInt(value));
                    break;
                case "PriceType":
                    if (!item) {
                        break;
                    }
                    switch (value) {
                        case "MINT":
                            item.price_type = "ap";
                            break;
                        case "GOLD":
                            item.price_type = "gold";
                            break;
                        default:
                            console.warn(`Invalid PriceType "${value}" for item ${item?.id}`);
                    }
                    break;
                case "Price0":
                    if (!item) {
                        break;
                    }
                    item.price = parseInt(value);
                    break;
                case "Enable":
                    if (!item) {
                        break;
                    }
                    item.available_in_shop = !!parseInt(value);
                    break;
                case "Name":
                    if (!item) {
                        break;
                    }
                    item.name_shop = value;
                    break;
            }
        }
    }
}

async function download(url: string) {
    const reply = await fetch(url);
    if (!reply.ok) {
        alert(`Failed downloading data from ${url}`);
    }
    return reply.text();
}

export async function downloadItems() {
    const itemData = await download("https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/auth-server/src/main/resources/res/Item_Parts_Ini3.xml");
    const shopData = await download("https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/auth-server/src/main/resources/res/Shop_Ini3.xml");
    parseItemData(itemData);
    parseShopData(shopData);
    console.log(`Loaded ${items.size} items`);
}

function itemToTableRow(item: Item): HTMLTableRowElement {
    //Name
    //Character
    //Part
    //Str
    //Sta
    //Dex
    //Wil
    //Smash
    //Movement
    //Charge
    //Lob
    //Serve
    //Max level

    const priceString = (item: Item) => {
        switch (item.price_type) {
            case "gold":
                return `${item.price} gold`;
            case "ap":
                return `${item.price} ap`;
        }
        return "";
    }

    const nameString = (item: Item) => {
        if (item.name_shop !== item.name_en) {
            return item.name_en + "/" + item.name_shop;
        }
        return item.name_en;
    }

    const row = createHTML(
        ["tr",
            ["td", item.name_en],
            ["td", item.character],
            ["td", item.part],
            ["td", `${item.str}`],
            ["td", `${item.sta}`],
            ["td", `${item.dex}`],
            ["td", `${item.wil}`],
            ["td", `${item.smash}`],
            ["td", `${item.movement}`],
            ["td", `${item.charge}`],
            ["td", `${item.lob}`],
            ["td", `${item.serve}`],
            ["td", `${item.level}`],
            ["td", priceString(item)],
        ]
    );
    return row;
}

export function getResultsTable(filter: (item: Item) => boolean, priorizer: (items: Item[], item: Item) => Item[]): HTMLTableElement {
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
            ["col"],
            ["col"],
            ["col"],
            ["col"],
            ["col"],
            ["col"],
            ["col"],
            ["col"],
            ["col"],
            ["col"],
            ["col"],
            ["col"],
            ["col"],
            ["col"],
            ["tr",
                ["th", "Name"],
                ["th", "Character"],
                ["th", "Part"],
                ["th", "Str"],
                ["th", "Sta"],
                ["th", "Dex"],
                ["th", "Wil"],
                ["th", "Smash"],
                ["th", "Movement"],
                ["th", "Charge"],
                ["th", "Lob"],
                ["th", "Serve"],
                ["th", "Level"],
                ["th", "Price"],
            ]
        ]
    );
    for (const result of Object.values(results)) {
        for (const item of result) {
            table.appendChild(itemToTableRow(item));
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