import { createHTML } from './html';

export const characters = ["Niki", "LunLun", "Lucy", "Shua", "Dhanpir", "Pochi", "Al"] as const;
export type Character = typeof characters[number];
export function isCharacter(character: string): character is Character {
    return (characters as unknown as string[]).includes(character);
}

export type Part = "Hat" | "Hair" | "Dye" | "Upper" | "Lower" | "Shoes" | "Socks" | "Hand" | "Backpack" | "Face" | "Racket" | "Other";

export class ItemSource {
    constructor(readonly shop_id: number) { }

    get requiresGuardian(): boolean {
        if (this instanceof ShopItemSource) {
            return false;
        }
        else if (this instanceof GachaItemSource) {
            return [...this.item.sources.values()].every(source => source.requiresGuardian);
        }
        else if (this instanceof GuardianItemSource) {
            return true;
        }
        else {
            throw "Internal error";
        }
    }

    get item() {
        const item = shop_items.get(this.shop_id);
        if (!item) {
            console.error(`Failed finding item of itemSource ${this.shop_id}`);
            throw "Internal error";
        }
        return item;
    }
}

export class ShopItemSource extends ItemSource {
    constructor(shop_id: number, readonly price: number, readonly ap: boolean, readonly items: Item[]) {
        super(shop_id);
    }
}

export class GachaItemSource extends ItemSource {
    constructor(shop_id: number) {
        super(shop_id);
    }

    gachaTries(item: Item, character?: Character) {
        const gacha = gachas.get(this.shop_id);
        if (!gacha) {
            throw "Internal error";
        }
        return gacha.average_tries(item, character);
    }
}

export class GuardianItemSource extends ItemSource {
    constructor(
        readonly guardian_map: string,
        readonly items: Item[],
        readonly xp: number,
        readonly need_boss: boolean,
        readonly boss_time: number) {
        super(GuardianItemSource.guardian_map_id(guardian_map));
    }

    static guardian_map_id(map: string) {
        let index = this.guardian_maps.indexOf(map);
        if (index === -1) {
            index = this.guardian_maps.length;
            this.guardian_maps.push(map);
        }
        return -index;
    }

    private static guardian_maps = [""];
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
    part: Part = "Other";
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
    sources: ItemSource[] = [];
    statFromString(name: string): number {
        switch (name) {
            case "Mov Speed":
                return this.movement;
            case "Charge":
                return this.charge;
            case "Lob":
                return this.lob;
            case "Smash":
                return this.smash;
            case "Str":
                return this.str;
            case "Dex":
                return this.dex;
            case "Sta":
                return this.sta;
            case "Will":
                return this.wil;
            case "Max Str":
                return this.max_str;
            case "Max Dex":
                return this.max_dex;
            case "Max Sta":
                return this.max_sta;
            case "Max Will":
                return this.max_wil;
            case "Serve":
                return this.serve;
            case "Quickslots":
                return this.quickslots;
            case "Buffslots":
                return this.buffslots;
            case "HP":
                return this.hp;
            default:
                throw "Internal error";
        }
    }
}

class Gacha {
    constructor(readonly shop_index: number, readonly gacha_index: number, readonly name: string) {
        for (const character of characters) {
            this.shop_items.set(character, new Map<Item, [/*probability:*/ number, /*quantity_min:*/ number, /*quantity_max:*/ number]>())
        }
    }

    add(item: Item, probability: number, character: Character, quantity_min: number, quantity_max: number) {
        if (item.character && item.character !== character) {
            //console.info(`Item ${item.id} from gacha "${this.name}" ${this.gacha_index} has wrong character`);
            character = item.character;
        }
        this.shop_items.get(character)!.set(item, [probability, quantity_min, quantity_max]);
        this.character_probability.set(character, probability + (this.character_probability.get(character) || 0));
    }

    average_tries(item: Item, character: Character | undefined = undefined) {
        const chars: readonly Character[] = character ? ([character]) : characters;
        const probability = chars.reduce((p, character) => p + (this.shop_items.get(character)!.get(item)?.[0] || 0), 0);
        if (probability === 0) {
            return 0;
        }
        const total_probability = chars.reduce((p, character) => p + this.character_probability.get(character)!, 0);
        return total_probability / probability;
    }

    get total_probability() {
        return characters.reduce((p, character) => p + this.character_probability.get(character)!, 0);
    }

    character_probability = new Map<Character, number>();
    shop_items = new Map<Character, Map<Item, [/*probability:*/ number, /*quantity_min:*/ number, /*quantity_max:*/ number]>>();
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
                    item.max_str = Math.max(parseInt(value), item.str);
                    break;
                case "MAX_STA":
                    item.max_sta = Math.max(parseInt(value), item.sta);
                    break;
                case "MAX_DEX":
                    item.max_dex = Math.max(parseInt(value), item.dex);
                    break;
                case "MAX_WIL":
                    item.max_wil = Math.max(parseInt(value), item.wil);
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
            if (inner_items.length === 1) {
                shop_items.set(index, inner_items[0]);
            }
            else {
                const item = new Item();
                item.name_en = match.groups.name_en || match.groups.name;
                shop_items.set(index, item);
            }
            if (enabled) {
                const itemSource = new ShopItemSource(index, price, price_type === "ap", inner_items);
                for (const item of inner_items) {
                    item.sources.push(itemSource);
                }
            }
        }
        else if (category === "LOTTERY") {
            const gachaItem = new Item();
            gachaItem.name_en = match.groups.name_en || match.groups.name;
            shop_items.set(index, gachaItem);
            if (enabled) {
                gachaItem.sources.push(new ShopItemSource(index, price, price_type === "ap", inner_items));
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

class ApiItem {
    productIndex = 0;
    display = 0;
    hitDisplay = false;
    enabled = false;
    useType = "";
    use0 = 0;
    use1 = 0;
    use2 = 0;
    priceType = "GOLD";
    oldPrice0 = 0;
    oldPrice1 = 0;
    oldPrice2 = 0;
    price0 = 0;
    price1 = 0;
    price2 = 0;
    couplePrice = 0;
    category = "";
    name = "";
    goldBack = 0;
    enableParcel = false;
    forPlayer = 0;
    item0 = 0;
    item1 = 0;
    item2 = 0;
    item3 = 0;
    item4 = 0;
    item5 = 0;
    item6 = 0;
    item7 = 0;
    item8 = 0;
    item9 = 0;
}

function isApiItem(obj: any): obj is ApiItem {
    if (obj === null || typeof obj !== "object") {
        return false;
    }
    return [
        typeof obj.productIndex === "number",
        typeof obj.display === "number",
        typeof obj.hitDisplay === "boolean",
        typeof obj.enabled === "boolean",
        typeof obj.useType === "string",
        typeof obj.use0 === "number",
        typeof obj.use1 === "number",
        typeof obj.use2 === "number",
        typeof obj.priceType === "string",
        typeof obj.oldPrice0 === "number",
        typeof obj.oldPrice1 === "number",
        typeof obj.oldPrice2 === "number",
        typeof obj.price0 === "number",
        typeof obj.price1 === "number",
        typeof obj.price2 === "number",
        typeof obj.couplePrice === "number",
        typeof obj.category === "string",
        typeof obj.name === "string",
        typeof obj.goldBack === "number",
        typeof obj.enableParcel === "boolean",
        typeof obj.forPlayer === "number",
        typeof obj.item0 === "number",
        typeof obj.item1 === "number",
        typeof obj.item2 === "number",
        typeof obj.item3 === "number",
        typeof obj.item4 === "number",
        typeof obj.item5 === "number",
        typeof obj.item6 === "number",
        typeof obj.item7 === "number",
        typeof obj.item8 === "number",
        typeof obj.item9 === "number"
    ].every(b => b);
}

function parseApiShopData(data: string) {
    for (const apiItem of JSON.parse(data)) {
        if (!isApiItem(apiItem)) {
            console.error(`Incorrect format of item: ${data}`);
            continue;
        }

        const inner_items = [
            apiItem.item0,
            apiItem.item1,
            apiItem.item2,
            apiItem.item3,
            apiItem.item4,
            apiItem.item5,
            apiItem.item6,
            apiItem.item7,
            apiItem.item8,
            apiItem.item9,
        ].filter(id => !!id && items.get(id)).map(id => items.get(id)!);

        if (apiItem.category === "PARTS") {
            if (inner_items.length === 1) {
                shop_items.set(apiItem.productIndex, inner_items[0]);
            }
            else {
                const item = new Item();
                item.name_en = apiItem.name;
                shop_items.set(apiItem.productIndex, item);
            }
            if (apiItem.enabled) {
                const itemSource = new ShopItemSource(apiItem.productIndex, apiItem.price0, apiItem.priceType === "MINT", inner_items);
                for (const item of inner_items) {
                    item.sources.push(itemSource);
                }
            }
        }
        else if (apiItem.category === "LOTTERY") {
            gachas.set(apiItem.productIndex, new Gacha(apiItem.productIndex, apiItem.item0, apiItem.name));
            const gachaItem = new Item();
            gachaItem.name_en = apiItem.name;
            shop_items.set(apiItem.productIndex, gachaItem);
            if (apiItem.enabled) {
                gachaItem.sources.push(new ShopItemSource(apiItem.productIndex, apiItem.price0, apiItem.priceType === "MINT", inner_items));
            }
        }
        else {
            const otherItem = new Item();
            otherItem.name_en = apiItem.name;
            shop_items.set(apiItem.productIndex, otherItem);
        }

    }
}

function parseGachaData(data: string, gacha: Gacha) {
    for (const line of data.split("\n")) {
        if (!line.includes("<LotteryItem_")) {
            continue;
        }
        const match = line.match(/\s*<LotteryItem_(?<character>[^ ]*) Index="\d+" _Name_="[^"]*" ShopIndex="(?<shop_id>\d+)" QuantityMin="(?<quantity_min>\d+)" QuantityMax="(?<quantity_max>\d+)" ChansPer="(?<probability>\d+\.?\d*)\s*" Effect="\d+" ProductOpt="\d+"\/>/);
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
        gacha.add(item, parseFloat(match.groups.probability), character, parseInt(match.groups.quantity_min), parseInt(match.groups.quantity_max));
    }
    for (const [, map] of gacha.shop_items) {
        for (const [item,] of map) {
            item.sources.push(new GachaItemSource(gacha.shop_index));
        }
    }
}

function parseGuardianData(data: string) {
    const guardianData = JSON.parse(data);
    if (!Array.isArray(guardianData)) {
        return;
    }
    function getNumber(o: any) {
        if (typeof o === "number") {
            return o;
        }
    }
    const bossTimeInfo = new Map<number, number>();
    for (const mapInfo of guardianData) {
        if (typeof mapInfo !== "object") {
            continue;
        }
        const map_name = mapInfo.Name;
        if (typeof map_name !== "string") {
            continue;
        }
        const rewards = Array.isArray(mapInfo.Rewards) ? [...mapInfo.Rewards] : [];
        const reward_items = rewards
            .filter((shop_id): shop_id is number => typeof shop_id === "number" && shop_items.has(shop_id))
            .map(shop_id => shop_items.get(shop_id)!);
        const ExpMultiplier = getNumber(mapInfo.ExpMultiplier) || 0;
        const IsBossStage = !!mapInfo.IsBossStage;
        const MapID = getNumber(mapInfo.MapId) || 0;
        let BossTriggerTimerInSeconds = getNumber(mapInfo.BossTriggerTimerInSeconds) || -1;
        if (BossTriggerTimerInSeconds === -1) {
            BossTriggerTimerInSeconds = bossTimeInfo.get(MapID) || -1;
        }
        else {
            if (MapID !== 0) {
                bossTimeInfo.set(MapID, BossTriggerTimerInSeconds);
            }
        }
        for (const item of reward_items) {
            const guardianSource = new GuardianItemSource(map_name, reward_items, ExpMultiplier, IsBossStage, BossTriggerTimerInSeconds);
            item.sources.push(guardianSource);
        }
    }
}

export async function download(url: string): Promise<string> {
    const filename = url.slice(url.lastIndexOf("/") + 1);
    const element = document.getElementById("loading");
    if (element instanceof HTMLElement) {
        element.textContent = `Loading ${filename}, please wait...`;
    }
    const reply = await fetch(url);
    const progressbar = document.getElementById("progressbar");
    if (progressbar instanceof HTMLProgressElement) {
        progressbar.value++;
    }
    if (!reply.ok) {
        alert(`Oops, something broke. Complain to Lilli/Kanone/XxharCs about:\nFailed downloading ${url} because of ${reply.status}${reply.statusText ? " " + reply.status : ""}.`);
        if (url.endsWith(".json")) {
            return "[]";
        }
        else if (url.endsWith(".xml")) {
            return "<_></_>";
        }
        return "";
    }
    return reply.text();
}

export async function downloadItems() {
    const progressbar = document.getElementById("progressbar");
    if (progressbar instanceof HTMLProgressElement) {
        progressbar.value = 0;
        progressbar.max = 122;
    }
    const itemSource = "https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/auth-server/src/main/resources/res";
    const gachaSource = "https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/game-server/src/main/resources/res/lottery";
    const guardianSource = "https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/emulator/src/main/resources/res"
    const itemURL = itemSource + "/Item_Parts_Ini3.xml";
    const itemData = download(itemURL);
    //const shopURL = itemSource + "/Shop_Ini3.xml";
    const max_shop_pages = 20; //currently need only 10, should be enough
    const shopURL = "https://jftse.com/jftse-restservice/api/shop?size=1000&page=";
    const shopDatas = [...Array(max_shop_pages).keys()].map(n => download(`${shopURL}${n}`));
    const guardianURL = guardianSource + "/GuardianStages.json";
    const guardianData = download(guardianURL);
    parseItemData(await itemData);
    //parseShopData(await shopData);
    await Promise.all(shopDatas.map(p => p.then(data => parseApiShopData(data))));

    console.log(`Found ${gachas.size} gachas`);
    if (progressbar instanceof HTMLProgressElement) {
        progressbar.value = 0;
        progressbar.max = gachas.size + 3;
    }
    const gacha_items: [Promise<string>, Gacha, string][] = [];
    for (const [, gacha] of gachas) {
        const gacha_url = `${gachaSource}/Ini3_Lot_${`${gacha.gacha_index}`.padStart(2, "0")}.xml`;
        gacha_items.push([download(gacha_url), gacha, gacha_url]);
    }
    parseGuardianData(await guardianData);
    for (const [item, gacha, gacha_url] of gacha_items) {
        try {
            parseGachaData(await item, gacha);
        } catch (e) {
            console.warn(`Failed downloading ${gacha_url} because ${e}`);
        }
    }
    console.log(`Loaded ${items.size} items`);
}

function deletableItem(name: string, id: number) {
    return createHTML(["div", createHTML(["button", { class: "item_removal", "data-item_index": `${id}` }, "X"]), name]);
}

export function createPopupLink(text: string, content: HTMLElement | string | (HTMLElement | string)[]) {
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

function quantityString(quantity_min: number, quantity_max: number) {
    if (quantity_min === 1 && quantity_max === 1) {
        return "";
    }
    if (quantity_min === quantity_max) {
        return ` x ${quantity_max}`;
    }
    return ` x ${quantity_min}-${quantity_max}`;
}

function createGachaSourcePopup(item: Item | undefined, itemSource: ItemSource, character?: Character) {
    const content = character ? createHTML([
        "table",
        [
            "tr",
            ["th", "Item"],
            ["th", "Average Tries"],
        ],
    ]) : createHTML([
        "table",
        [
            "tr",
            ["th", "Item"],
            ["th", "Character"],
            ["th", "Average Tries"],
        ],
    ]);
    const gacha = gachas.get(itemSource.shop_id);
    if (!gacha) {
        throw "Internal error";
    }

    const gacha_items = new Map<Item, [number, number, number]>();
    for (const char of character === undefined ? characters : [character]) {
        const char_items = gacha.shop_items.get(char);
        if (!char_items) {
            continue;
        }
        for (const [char_gacha_item, [tickets, quantity_min, quantity_max]] of char_items) {
            const item_character = char_gacha_item.character || character;
            const item_tickets = item_character ? gacha.character_probability.get(item_character)! : gacha.total_probability;
            const probability = tickets / item_tickets;
            const previous_probability = gacha_items.get(char_gacha_item)?.[0] || 0;
            gacha_items.set(char_gacha_item, [previous_probability + probability, quantity_min, quantity_max]);
        }
    }

    for (const [char_gacha_item, [probability, quantity_min, quantity_max]] of gacha_items) {
        if (character) {
            content.appendChild(createHTML([
                "tr",
                item === char_gacha_item ? { class: "highlighted" } : "",
                ["td", char_gacha_item.name_en, quantityString(quantity_min, quantity_max)],
                ["td", { class: "numeric" }, `${prettyNumber(1 / probability, 2)}`],
            ]));
        }
        else {
            content.appendChild(createHTML([
                "tr",
                item === char_gacha_item ? { class: "highlighted" } : "",
                ["td", char_gacha_item.name_en, quantityString(quantity_min, quantity_max)],
                ["td", char_gacha_item.character || "*"],
                ["td", { class: "numeric" }, `${prettyNumber(1 / probability, 2)}`],
            ]));
        }
    }

    return createPopupLink(itemSource.item.name_en, [createHTML(["a", gacha.name]), content]);
}

function createSetSourcePopup(item: Item, itemSource: ShopItemSource) {
    const contentTable = createHTML(["table", ["tr", ["th", "Contents"]]]);
    for (const inner_item of itemSource.items) {
        contentTable.appendChild(createHTML(["tr", inner_item === item ? { class: "highlighted" } : "", ["td", inner_item.name_en]]));
    }
    return createPopupLink(itemSource.item.name_en, [createHTML(["a", itemSource.item.name_en, contentTable])]);
}

function prettyTime(seconds: number) {
    return `${Math.floor(seconds / 60)}:${`${seconds % 60}`.padStart(2, "0")}`;
}

function createGuardianPopup(item: Item, itemSource: GuardianItemSource) {
    const content = [
        `Guardian map ${itemSource.guardian_map}`,
        createHTML(
            [
                "ul", { class: "layout" },
                ["li", "Items:",
                    ["ul", { class: "layout" },
                        ...itemSource.items.reduce(
                            (curr, reward_item) =>
                                [...curr, createHTML(["li", { class: reward_item === item ? "highlighted" : "" }, reward_item.name_en])],
                            [] as (HTMLElement | string)[]
                        ),
                    ],
                ],
                ["li", `Requires boss: ${itemSource.need_boss ? "Yes" : "No"}`],
                ...(itemSource.boss_time > 0 ? [createHTML(["li", `Boss time: ${prettyTime(itemSource.boss_time)}`])] : []),
                ["li", `EXP multiplier: ${itemSource.xp}`],
            ]
        )
    ];
    return createPopupLink(itemSource.guardian_map, content);
}

function itemSourcesToElementArray(
    item: Item,
    sourceFilter: (itemSource: ItemSource) => boolean,
    character?: Character) {
    return [...item.sources.values()]
        .filter(sourceFilter)
        .map(itemSource => sourceItemElement(item, itemSource, sourceFilter, character));
}

function makeSourcesList(list: (HTMLElement | string)[][]): (HTMLElement | string)[] {
    const result: (HTMLElement | string)[] = [];
    function add(element: HTMLElement | string) {
        if (typeof element === "string" && typeof result[result.length - 1] === "string") {
            result[result.length - 1] = result[result.length - 1] + element;
            return;
        }
        result.push(element);
    }
    let first = true;
    for (const elements of list) {
        if (elements.length === 0) {
            add(" ");
            continue;
        }
        if (!first) {
            add(", ");
        }
        else {
            first = false;
        }
        for (const element of elements) {
            if (element === "") {
                continue;
            }
            add(element);
        }
    }
    return result;
}

function sourceItemElement(item: Item, itemSource: ItemSource, sourceFilter: (itemSource: ItemSource) => boolean, character?: Character): (HTMLElement | string)[] {
    if (itemSource instanceof GachaItemSource) {
        const char = itemSource.requiresGuardian ? undefined : character;
        const sources = itemSourcesToElementArray(itemSource.item, sourceFilter, character);
        const sourcesList = makeSourcesList(sources);
        return [
            createGachaSourcePopup(item, itemSource, char),
            ` x `,
            createChancePopup(itemSource.gachaTries(item, character)),
            ...(sourcesList.length > 0 ? [" "] : []),
            ...sourcesList,
        ];
    }
    else if (itemSource instanceof ShopItemSource) {
        if (itemSource.items.length === 1) {
            return [`${itemSource.price} ${itemSource.ap ? "AP" : "Gold"}`];
        }
        return [
            createSetSourcePopup(item, itemSource),
            ` ${itemSource.price} ${itemSource.ap ? "AP" : "Gold"}`
        ];
    }
    else if (itemSource instanceof GuardianItemSource) {
        return [createGuardianPopup(item, itemSource)];
    }
    else {
        throw "Internal error";
    }
}

function itemToTableRow(item: Item, sourceFilter: (itemSource: ItemSource) => boolean, priorityStats: string[], character?: Character): HTMLTableRowElement {
    const row = createHTML(
        ["tr",
            ["td", { class: "Name_column" }, deletableItem(item.name_en, item.id)],
            ["td", { class: "Character_column" }, item.character ?? "All"],
            ["td", { class: "Part_column" }, item.part],
            ...priorityStats.map(stat => createHTML(["td", { class: "numeric" }, stat.split("+").map(s => item.statFromString(s)).join("+")])),
            ["td", { class: "Level_column numeric" }, `${item.level}`],
            ["td", { class: "Source_column" }, ...makeSourcesList(itemSourcesToElementArray(item, sourceFilter, character))],
        ]
    );
    return row;
}

export function getGachaTable(filter: (item: Item) => boolean, char?: Character): HTMLTableElement {
    const table = createHTML(
        ["table",
            ["tr",
                ["th", { class: "Name_column" }, "Name"],
            ]
        ]
    );
    for (const [, gacha] of gachas) {
        const gachaItem = shop_items.get(gacha.shop_index);
        if (!gachaItem) {
            throw "Internal error";
        }
        if (filter(gachaItem)) {
            table.appendChild(createHTML(["tr", ["td", createGachaSourcePopup(undefined, new ItemSource(gacha.shop_index), char)]]));
        }
    }
    return table;
}

export function getResultsTable(
    filter: (item: Item) => boolean,
    sourceFilter: (itemSource: ItemSource) => boolean,
    priorizer: (items: Item[], item: Item) => Item[],
    priorityStats: string[],
    character?: Character): HTMLTableElement {
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
                ["th", { class: "Character_column" }, "Character"],
                ["th", { class: "Part_column" }, "Part"],
                ...priorityStats.map(stat => createHTML(["th", { class: "numeric" }, stat])),
                ["th", { class: "Level_column numeric" }, "Level"],
                ["th", { class: "Source_column" }, "Source"],
            ]
        ]
    );

    type MapOptions = { [key: string]: number[] };

    type Cost = {
        gold: number,
        ap: number,
        maps: MapOptions,
    };

    function combineMaps(m1: MapOptions, m2: MapOptions): MapOptions {
        const result = { ...m1 };
        for (const [map, tries] of Object.entries(m2)) {
            if (result[map]) {
                result[map] = result[map].concat(tries);
            }
            else {
                result[map] = tries;
            }
        }
        return result;
    }

    function combineCosts(cost1: Cost, cost2: Cost): Cost {
        return {
            gold: cost1.gold + cost2.gold,
            ap: cost1.ap + cost2.ap,
            maps: combineMaps(cost1.maps, cost2.maps),
        };
    }

    function minMap(m1: MapOptions, m2: MapOptions): MapOptions {
        const result = { ...m1 };
        for (const [map, tries] of Object.entries(m2)) {
            if (tries.length !== 1) {
                throw "Internal error";
            }
            if (result[map]) {
                result[map] = [Math.min(result[map][0], tries[0])];
            }
            else {
                result[map] = tries;
            }
        }
        return result;
    }

    function minCost(cost1: Cost, cost2: Cost): Cost {
        return [cost1.ap, cost1.gold] < [cost1.ap, cost1.gold] ?
            {
                gold: cost1.gold,
                ap: cost1.ap,
                maps: minMap(cost1.maps, cost2.maps),
            } :
            {
                gold: cost2.gold,
                ap: cost2.ap,
                maps: minMap(cost1.maps, cost2.maps),
            };
    }

    function costOf(item: Item, character?: Character): Cost {
        return [...item.sources.values()]
            .filter(sourceFilter)
            .reduce((curr, itemSource) => {
                const cost = (() => {
                    if (itemSource instanceof ShopItemSource) {
                        if (itemSource.ap) {
                            return { gold: 0, ap: itemSource.price, maps: {} };
                        }
                        return { gold: itemSource.price, ap: 0, maps: {} };
                    }
                    else if (itemSource instanceof GachaItemSource) {
                        const singleCost = costOf(itemSource.item, character);
                        const multiplier = itemSource.gachaTries(item, character);
                        return {
                            gold: singleCost.gold * multiplier,
                            ap: singleCost.ap * multiplier,
                            maps: Object.fromEntries(
                                Object.entries(singleCost.maps)
                                    .map(([map, tries]) => [map, tries.map(n => n * multiplier)])
                            )
                        };
                    }
                    else if (itemSource instanceof GuardianItemSource) {
                        return {
                            gold: 0,
                            ap: 0,
                            maps: Object.fromEntries([[itemSource.guardian_map, [itemSource.items.length]]])
                        };
                    }
                    else {
                        throw "Internal error";
                    }
                })();
                return minCost(curr, cost);
            },
                { gold: 0, ap: 0, maps: {} }
            );
    }

    const statistics = {
        characters: new Set<Character>,
        ...priorityStats.reduce((curr, stat) => ({ ...curr, [stat]: 0 }), {}),
        Level: 0,
        cost: { ap: 0, gold: 0, maps: {} } as Cost,
    };

    for (const result of Object.values(results)) {
        if (result.length === 0) {
            continue;
        }

        for (const stat of priorityStats) {
            //@ts-ignore
            if (typeof statistics[stat] !== "number") {
                continue;
            }
            const value = stat.split("+").reduce((curr, statName) => curr + result[0].statFromString(statName), 0);
            //@ts-ignore
            statistics[stat] += value;
        }

        statistics.Level = Math.max(result[0].level, statistics.Level);

        for (const item of result) {
            for (const char of item.character ? [item.character] : characters) {
                statistics.characters.add(char)
                table.appendChild(itemToTableRow(item, sourceFilter, priorityStats, char));
            }
            statistics.cost = combineCosts(costOf(item, character && isCharacter(character) ? character : undefined), statistics.cost);
        }
    }

    if (statistics.characters.size === 1) {
        const total_sources: string[] = [];
        if (statistics.cost.gold > 0) {
            total_sources.push(`${statistics.cost.gold.toFixed(0)} Gold`);
        }
        if (statistics.cost.ap > 0) {
            total_sources.push(`${statistics.cost.ap.toFixed(0)} AP`);
        }
        //statistics['Guardian games'].forEach((count, map) => total_sources.push(`${count.toFixed(0)} x ${map}`));
        table.appendChild(createHTML(
            ["tr",
                ["td", { class: "total Name_column" }, "Total:"],
                ["td", { class: "total Character_column" }],
                ["td", { class: "total Part_column" }],
                ...priorityStats.map(stat => createHTML(["td", { class: "total numeric" },
                    //@ts-ignore
                    `${statistics[stat]}`
                ])),
                ["td", { class: "total Level_column numeric" }, `${statistics.Level}`],
                ["td", { class: "total Source_column" }, total_sources.join(", ")],
            ]
        ));
        for (const column_element of table.getElementsByClassName(`Character_column`)) {
            if (!(column_element instanceof HTMLElement)) {
                continue;
            }
            column_element.hidden = true;
        }
    }

    for (const attribute of priorityStats) {
        //@ts-ignore
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