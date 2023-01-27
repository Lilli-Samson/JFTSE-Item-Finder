import { createHTML } from './html';

export type Character = "Niki" | "LunLun" | "Lucy" | "Shua" | "Dhanpir" | "Pochi" | "Al";

export type Part = "Hat" | "Hair" | "Dye" | "Upper" | "Lower" | "Shoes" | "Socks" | "Hand" | "Backpack" | "Face" | "Racket";

export class ItemSource {
    constructor(item_name: string, price: number, ap: boolean = false, gacha_factor: number = 0) {
        this.item_name = item_name;
        this.price = price;
        if (ap) {
            this.price *= -1;
        }
        this.gacha_factor = gacha_factor;
    }
    display_string(): string {
        if (this.price) {
            const currency = this.is_ap ? "AP" : "Gold";
            const price = Math.abs(this.price);
            return `${this.item_name ? `"${this.item_name}" ` : ""}Shop ${price} ${currency}${this.gacha_factor ? ` x ${this.gacha_factor} ≈ ${this.gacha_factor * price} ${currency}` : ""}`;
        }
        let gf = this.gacha_factor.toFixed(1);
        if (gf.endsWith(".0")) {
            gf = gf.substring(0, gf.length - 2);
        }
        return `${this.item_name} x ${gf}`;
    }
    get is_ap(): boolean {
        return this.price < 0;
    }
    get is_gold(): boolean {
        return this.price > 0;
    }
    get is_gacha(): boolean {
        return this.gacha_factor !== 0;
    }
    item_name: string;
    price: number;
    gacha_factor: number;
}

export class Item {
    id = 0;
    shop_id = 0;
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

let items = new Map<number, Item>();
let shop_items = new Map<number, Item>();
let gachas: { name: string, id: number }[] = [];

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
            gachas.push({ name: name, id: parseInt(match.groups.item0) });
        }
        if (category === "GUILD") {
            continue;
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
            let item = items.get(itemID);
            if (!item) {
                item = new Item();
                item.name_en = match.groups.name_en ?? "";
                //todo: fill rest of item
            }
            if (enabled) {
                item.sources.push(new ItemSource(name === item.name_en ? "" : name, price, price_type === "ap"));
            }
            item.shop_id = index;
            shop_items.set(item.shop_id, item);
        }
        count++;
    }
    console.log(`Found ${count} shop items`);
}

function parseGachaData(data: string, name: string) {
    const gacha_results: { id: number, chance: number }[] = [];
    for (const match of data.matchAll(/<LotteryItem_[^ ]* Index="\d+" _Name_="[^"]*" ShopIndex="(?<shop_id>\d+)" QuantityMin="\d+" QuantityMax="\d+" ChansPer="(?<probability>\d+\.?\d*)" Effect="\d+" ProductOpt="\d+"\/>/g)) {
        if (!match.groups) {
            continue;
        }
        gacha_results.push({ id: parseInt(match.groups.shop_id), chance: parseFloat(match.groups.probability) });
    }
    const total_probability = gacha_results.map(gacha_result => gacha_result.chance).reduce((prev, curr) => prev + curr, 0);
    for (const gacha_result of gacha_results) {
        const item = shop_items.get(gacha_result.id);
        if (!item) {
            console.warn(`Failed to find item ${gacha_result.id} from "${name}" in shop`);
            continue;
        }
        item.sources.push(new ItemSource(name, 0, false, total_probability / gacha_result.chance));
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
        alert(`Failed downloading data from ${url}`);
    }
    return reply.text();
}

export async function downloadItems() {
    let downloadCounter = 1;
    const itemURL = "https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/emulator/src/main/resources/res/Item_Parts_Ini3.xml";
    const itemData = await download(itemURL, downloadCounter++);
    const shopURL = "https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/emulator/src/main/resources/res/Shop_Ini3.xml";
    const shopData = await download(shopURL, downloadCounter++);
    parseItemData(itemData);
    parseShopData(shopData);
    console.log(`Found ${gachas.length} gachas`);
    for (const gacha of gachas) {
        const gacha_url = `https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/emulator/src/main/resources/res/lottery/Ini3_Lot_${`${gacha.id}`.padStart(2, "0")}.xml`;
        try {
            parseGachaData(await download(gacha_url, downloadCounter++, gachas.length + 2), gacha.name);
        } catch (e) {
            console.warn(`Failed downloading ${gacha_url} because ${e}`);
        }
    }
    console.log(`Loaded ${items.size} items`);
}

function itemToTableRow(item: Item, sourceFilter: (itemSource: ItemSource) => boolean): HTMLTableRowElement {
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

    const nameString = (item: Item) => {
        if (item.name_shop !== item.name_en) {
            return item.name_en + "/" + item.name_shop;
        }
        return item.name_en;
    }

    const row = createHTML(
        ["tr",
            ["td", item.name_en],
            ["td", `${item.id}`],
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
            ["td", item.sources.filter(sourceFilter).map(item => item.display_string()).join(", "),
            ]
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
            ["col"],
            ["tr",
                ["th", "Name"],
                ["th", "ID"],
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
                ["th", "Source"],
            ]
        ]
    );
    for (const result of Object.values(results)) {
        for (const item of result) {
            table.appendChild(itemToTableRow(item, sourceFilter));
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