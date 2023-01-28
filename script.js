(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLeafStates = getLeafStates;
exports.makeCheckboxTree = makeCheckboxTree;
var _html = require("./html");
function getChildren(node) {
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
    return Array.from(potentialSiblingList.children).filter(e => e instanceof HTMLInputElement);
  }
  return [];
}
function applyCheckedToDescendants(node) {
  for (const child of getChildren(node)) {
    if (child.checked !== node.checked) {
      child.checked = node.checked;
      child.indeterminate = false;
      applyCheckedToDescendants(child);
    }
  }
}
function getParent(node) {
  const parentUL = node.parentElement;
  if (!(parentUL instanceof HTMLUListElement)) {
    return;
  }
  const grandparentUL = parentUL.parentElement;
  if (!(grandparentUL instanceof HTMLUListElement)) {
    return;
  }
  let candidate;
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
function updateAncestors(node) {
  const parent = getParent(node);
  if (!parent) {
    return;
  }
  let foundChecked = false;
  let foundUnchecked = false;
  let foundIndeterminate = false;
  for (const child of getChildren(parent)) {
    if (child.checked) {
      foundChecked = true;
    } else {
      foundUnchecked = true;
    }
    if (child.indeterminate) {
      foundIndeterminate = true;
    }
  }
  if (foundIndeterminate || foundChecked && foundUnchecked) {
    parent.indeterminate = true;
  } else if (foundChecked) {
    parent.checked = true;
    parent.indeterminate = false;
  } else if (foundUnchecked) {
    parent.checked = false;
    parent.indeterminate = false;
  }
  updateAncestors(parent);
}
function applyCheckListener(node) {
  node.addEventListener("change", function (e) {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    applyCheckedToDescendants(target);
    updateAncestors(target);
  });
}
function applyCheckListeners(node) {
  for (const element of node.children) {
    if (element instanceof HTMLInputElement) {
      applyCheckListener(element);
    } else if (element instanceof HTMLUListElement) {
      applyCheckListeners(element);
    }
  }
}
function makeCheckboxTreeNode(treeNode) {
  if (typeof treeNode === "string") {
    let disabled = false;
    if (treeNode[0] === "-") {
      treeNode = treeNode.substring(1);
      disabled = true;
    }
    const node = [(0, _html.createHTML)(["input", {
      type: "checkbox",
      id: treeNode,
      checked: "true"
    }]), (0, _html.createHTML)(["label", {
      for: treeNode
    }, treeNode])];
    if (disabled) {
      node[0].classList.add("disabled");
      node[1].classList.add("disabled");
    }
    return node;
  } else {
    const list = (0, _html.createHTML)(["ul"]);
    for (let i = 0; i < treeNode.length; i++) {
      const node = treeNode[i];
      const last = i === treeNode.length - 1;
      for (const e of makeCheckboxTreeNode(node)) {
        list.appendChild(e);
      }
      if (!last && typeof node === "string") {
        list.appendChild((0, _html.createHTML)(["br"]));
      }
    }
    return [list];
  }
}
function makeCheckboxTree(treeNode) {
  let root = makeCheckboxTreeNode(treeNode)[0];
  if (!(root instanceof HTMLUListElement)) {
    throw "Internal error";
  }
  root.classList.add("treeview");
  applyCheckListeners(root);
  return root;
}
function getLeafStates(node) {
  let states = {};
  for (const element of node.children) {
    if (element instanceof HTMLInputElement) {
      if (getChildren(element).length === 0) {
        states[element.id] = element.checked;
      }
    } else if (element instanceof HTMLUListElement) {
      states = {
        ...states,
        ...getLeafStates(element)
      };
    }
  }
  return states;
}

},{"./html":2}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createHTML = createHTML;
function createHTML(node) {
  const element = document.createElement(node[0]);
  function handle(parameter) {
    if (typeof parameter === "string" || parameter instanceof HTMLElement) {
      element.append(parameter);
    } else if (Array.isArray(parameter)) {
      element.append(createHTML(parameter));
    } else {
      for (const key in parameter) {
        element.setAttribute(key, parameter[key]);
      }
    }
  }
  for (let i = 1; i < node.length; i++) {
    handle(node[i]);
  }
  return element;
}

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ItemSource = exports.Item = void 0;
exports.downloadItems = downloadItems;
exports.getMaxItemLevel = getMaxItemLevel;
exports.getResultsTable = getResultsTable;
var _html = require("./html");
class ItemSource {
  constructor(item_name, price, ap = false, gacha_factor = 0) {
    this.item_name = item_name;
    this.price = price;
    if (ap) {
      this.price *= -1;
    }
    this.gacha_factor = gacha_factor;
  }
  display_string() {
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
  get is_ap() {
    return this.price < 0;
  }
  get is_gold() {
    return this.price > 0;
  }
  get is_gacha() {
    return this.gacha_factor !== 0;
  }
  item_name;
  price;
  gacha_factor;
}
exports.ItemSource = ItemSource;
class Item {
  id = 0;
  name_kr = "";
  name_en = "";
  name_shop = "";
  useType = "";
  maxUse = 0;
  hidden = false;
  resist = "";
  character = "Niki";
  part = "Hat";
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
  sources = [];
}
exports.Item = Item;
let items = new Map();
let shop_items = new Map();
let gachas = [];
function parseItemData(data) {
  if (data.length < 1000) {
    console.warn(`Items file is only ${data.length} bytes long`);
  }
  for (const [, result] of data.matchAll(/\<Item (.*)\/\>/g)) {
    const item = new Item();
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
function parseShopData(data) {
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
      gachas.push({
        name: name,
        id: parseInt(match.groups.item0)
      });
    }
    const enabled = !!parseInt(match.groups.enabled);
    const price_type = match.groups.price_type === "MINT" ? "ap" : match.groups.price_type === "GOLD" ? "gold" : "none";
    const price = parseInt(match.groups.price);
    const parcel_from_shop = !!parseInt(match.groups.parcel_from_shop);
    const itemIDs = [parseInt(match.groups.item0), parseInt(match.groups.item1), parseInt(match.groups.item2), parseInt(match.groups.item3), parseInt(match.groups.item4), parseInt(match.groups.item5), parseInt(match.groups.item6), parseInt(match.groups.item7), parseInt(match.groups.item8), parseInt(match.groups.item9)];
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
          oldItem.sources.push(new ItemSource(name === newItem.name_en ? "" : name, price, price_type === "ap"));
        }
        shop_items.set(index, oldItem);
      } else {
        shop_items.set(index, newItem);
      }
    }
    count++;
  }
  console.log(`Found ${count} shop items`);
}
function parseGachaData(data, name) {
  const gacha_results = [];
  for (const match of data.matchAll(/<LotteryItem_[^ ]* Index="\d+" _Name_="[^"]*" ShopIndex="(?<shop_id>\d+)" QuantityMin="\d+" QuantityMax="\d+" ChansPer="(?<probability>\d+\.?\d*)" Effect="\d+" ProductOpt="\d+"\/>/g)) {
    if (!match.groups) {
      continue;
    }
    gacha_results.push({
      id: parseInt(match.groups.shop_id),
      chance: parseFloat(match.groups.probability)
    });
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
async function download(url, value = undefined, max_value = undefined) {
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
async function downloadItems() {
  const itemSource = "https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/auth-server/src/main/resources/res";
  const gachaSource = "https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/emulator/src/main/resources/res/lottery";
  let downloadCounter = 1;
  const itemURL = itemSource + "/Item_Parts_Ini3.xml";
  const itemData = await download(itemURL, downloadCounter++);
  const shopURL = itemSource + "/Shop_Ini3.xml";
  const shopData = await download(shopURL, downloadCounter++);
  parseItemData(itemData);
  parseShopData(shopData);
  console.log(`Found ${gachas.length} gachas`);
  for (const gacha of gachas) {
    const gacha_url = `${gachaSource}/Ini3_Lot_${`${gacha.id}`.padStart(2, "0")}.xml`;
    try {
      parseGachaData(await download(gacha_url, downloadCounter++, gachas.length + 2), gacha.name);
    } catch (e) {
      console.warn(`Failed downloading ${gacha_url} because ${e}`);
    }
  }
  console.log(`Loaded ${items.size} items`);
}
function itemToTableRow(item, sourceFilter) {
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
  const nameString = item => {
    if (item.name_shop !== item.name_en) {
      return item.name_en + "/" + item.name_shop;
    }
    return item.name_en;
  };
  const row = (0, _html.createHTML)(["tr", ["td", item.name_en], ["td", `${item.id}`], ["td", item.character], ["td", item.part], ["td", `${item.str}`], ["td", `${item.sta}`], ["td", `${item.dex}`], ["td", `${item.wil}`], ["td", `${item.smash}`], ["td", `${item.movement}`], ["td", `${item.charge}`], ["td", `${item.lob}`], ["td", `${item.serve}`], ["td", `${item.hp}`], ["td", `${item.level}`], ["td", item.sources.filter(sourceFilter).map(item => item.display_string()).join(", ")]]);
  return row;
}
function getResultsTable(filter, sourceFilter, priorizer) {
  const results = {
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
    "Racket": []
  };
  for (const [, item] of items) {
    if (filter(item)) {
      results[item.part] = priorizer(results[item.part], item);
    }
  }
  const table = (0, _html.createHTML)(["table", ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["tr", ["th", "Name"], ["th", "ID"], ["th", "Character"], ["th", "Part"], ["th", "Str"], ["th", "Sta"], ["th", "Dex"], ["th", "Wil"], ["th", "Smash"], ["th", "Movement"], ["th", "Charge"], ["th", "Lob"], ["th", "Serve"], ["th", "HP"], ["th", "Level"], ["th", "Source"]]]);
  for (const result of Object.values(results)) {
    for (const item of result) {
      table.appendChild(itemToTableRow(item, sourceFilter));
    }
  }
  return table;
}
function getMaxItemLevel() {
  //no reduce for Map?
  let max = 0;
  for (const [, item] of items) {
    max = Math.max(max, item.level);
  }
  return max;
}

},{"./html":2}],4:[function(require,module,exports){
"use strict";

var _checkboxTree = require("./checkboxTree");
var _itemLookup = require("./itemLookup");
var _html = require("./html");
const characters = ["All", "Niki", "LunLun", "Lucy", "Shua", "Dhanpir", "Pochi", "Al"];
const partsFilter = ["Parts", ["Head", ["Hat", "Hair", "Dye"], "Upper", "Lower", "Legs", ["Shoes", "Socks"], "Aux", ["Hand", "Backpack", "Face"], "Racket"]];
const availabilityFilter = ["Availability", ["Shop", ["Gold", "AP"], "Allow gacha", "-Guardian", "Parcel enabled", "Parcel disabled", "Exclude unavailable items", "Exclude statless items"]];
function getName(node) {
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
  const target = document.getElementById("characterFilters");
  if (!target) {
    return;
  }
  let first = true;
  for (const character of characters) {
    const id = `characterSelectors_${character}`;
    const radio_button = (0, _html.createHTML)(["input", {
      id: id,
      type: "radio",
      name: "characterSelectors",
      value: character
    }]);
    radio_button.addEventListener("input", updateResults);
    target.appendChild(radio_button);
    target.appendChild((0, _html.createHTML)(["label", {
      for: id
    }, character]));
    target.appendChild((0, _html.createHTML)(["br"]));
    if (first) {
      radio_button.checked = true;
      first = false;
    }
  }
  const filters = [[partsFilter, "partsFilter"], [availabilityFilter, "availabilityFilter"]];
  for (const [filter, name] of filters) {
    const target = document.getElementById(name);
    if (!target) {
      return;
    }
    const tree = (0, _checkboxTree.makeCheckboxTree)(filter);
    tree.addEventListener("change", updateResults);
    target.innerText = "";
    target.appendChild(tree);
  }
}
addFilterTrees();
let dragged;
function applyDragDrop() {
  document.addEventListener("dragstart", ({
    target
  }) => {
    if (!(target instanceof HTMLElement)) {
      return;
    }
    dragged = target;
  });
  document.addEventListener("dragover", event => {
    event.preventDefault();
  });
  document.addEventListener("drop", ({
    target
  }) => {
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (target.className == "dropzone" && target !== dragged) {
      if (dragged.parentNode !== target.parentNode) {
        //disallow dragging across different lists
        return;
      }
      const list = Array.from(dragged.parentNode?.children ?? new HTMLCollection());
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
function compare(lhs, rhs) {
  if (lhs == rhs) {
    return 0;
  }
  return lhs < rhs ? -1 : 1;
}
function updateResults() {
  const filters = [];
  const sourceFilters = [];
  {
    //character filter
    const characterFilterList = document.getElementsByName("characterSelectors");
    for (const element of characterFilterList) {
      if (!(element instanceof HTMLInputElement)) {
        throw "Internal error";
      }
      if (element.checked) {
        const selected_character = element.value;
        if (selected_character !== "All") {
          filters.push(item => item.character === selected_character);
        }
        ;
        break;
      }
    }
  }
  {
    //parts filter
    const partsFilterList = document.getElementById("partsFilter")?.children[0];
    if (!(partsFilterList instanceof HTMLUListElement)) {
      throw "Internal error";
    }
    const partsStates = (0, _checkboxTree.getLeafStates)(partsFilterList);
    filters.push(item => {
      return partsStates[item.part];
    });
  }
  {
    //availability filter
    const availabilityFilterList = document.getElementById("availabilityFilter")?.children[0];
    if (!(availabilityFilterList instanceof HTMLUListElement)) {
      throw "Internal error";
    }
    const availabilityStates = (0, _checkboxTree.getLeafStates)(availabilityFilterList);
    if (!availabilityStates["Gold"]) {
      sourceFilters.push(itemSource => !itemSource.is_gold);
    }
    if (!availabilityStates["AP"]) {
      sourceFilters.push(itemSource => !itemSource.is_ap);
    }
    if (!availabilityStates["Parcel enabled"]) {
      filters.push(item => !item.parcel_enabled);
    }
    if (!availabilityStates["Parcel disabled"]) {
      filters.push(item => item.parcel_enabled);
    }
    if (!availabilityStates["Allow gacha"]) {
      sourceFilters.push(itemSource => !itemSource.is_gacha);
    }
    if (availabilityStates["Exclude statless items"]) {
      filters.push(item => !!item.buffslots || !!item.charge || !!item.dex || !!item.hp || !!item.lob || !!item.movement || !!item.quickslots || !!item.serve || !!item.smash || !!item.sta || !!item.str || !!item.wil);
    }
    if (availabilityStates["Exclude unavailable items"]) {
      filters.push(item => item.sources.filter(source => sourceFilters.every(sourceFilter => sourceFilter(source))).length > 0);
    }
  }
  {
    //misc filter
    const levelrange = document.getElementById("levelrange");
    if (!(levelrange instanceof HTMLInputElement)) {
      throw "Internal error";
    }
    const maxLevel = parseInt(levelrange.value);
    filters.push(item => item.level <= maxLevel);
    const namefilter = document.getElementById("nameFilter");
    if (!(namefilter instanceof HTMLInputElement)) {
      throw "Internal error";
    }
    const item_name = namefilter.value;
    if (item_name) {
      filters.push(item => item.name_en.toLowerCase().includes(item_name.toLowerCase()));
    }
  }
  const comparators = [];
  {
    const priorityList = document.getElementById("priority list");
    if (!(priorityList instanceof HTMLOListElement)) {
      throw "Internal error";
    }
    const texts = Array.from(priorityList.childNodes).filter(node => !node.textContent?.includes('\n')).map(node => node.textContent);
    for (const text of texts) {
      switch (text) {
        case "Movement Speed":
          comparators.push((lhs, rhs) => compare(lhs.movement, rhs.movement));
          break;
        case "Charge":
          comparators.push((lhs, rhs) => compare(lhs.charge, rhs.charge));
          break;
        case "Lob":
          comparators.push((lhs, rhs) => compare(lhs.lob, rhs.lob));
          break;
        case "Str":
          comparators.push((lhs, rhs) => compare(lhs.str, rhs.str));
          break;
        case "Dex":
          comparators.push((lhs, rhs) => compare(lhs.dex, rhs.dex));
          break;
        case "Sta":
          comparators.push((lhs, rhs) => compare(lhs.sta, rhs.sta));
          break;
        case "Will":
          comparators.push((lhs, rhs) => compare(lhs.wil, rhs.wil));
          break;
        case "Serve":
          comparators.push((lhs, rhs) => compare(lhs.serve, rhs.serve));
          break;
        case "Quickslots":
          comparators.push((lhs, rhs) => compare(lhs.quickslots, rhs.quickslots));
          break;
        case "Buffslots":
          comparators.push((lhs, rhs) => compare(lhs.buffslots, rhs.buffslots));
          break;
        case "HP":
          comparators.push((lhs, rhs) => compare(lhs.hp, rhs.hp));
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

  const table = (0, _itemLookup.getResultsTable)(item => filters.every(filter => filter(item)), itemSource => sourceFilters.every(filter => filter(itemSource)), (items, item) => {
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
  });
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
  const callback = () => {
    levelDisplay.textContent = `Max level requirement: ${levelrange.value}`;
    updateResults();
  };
  levelrange.addEventListener("input", callback);
  callback();
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
  await (0, _itemLookup.downloadItems)();
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
  levelrange.max = `${(0, _itemLookup.getMaxItemLevel)()}`;
  levelrange.value = levelrange.max;
  levelrange.dispatchEvent(new Event("input"));
  updateResults();
});

},{"./checkboxTree":1,"./html":2,"./itemLookup":3}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjaGVja2JveFRyZWUudHMiLCJodG1sLnRzIiwiaXRlbUxvb2t1cC50cyIsIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0FDQUE7QUFJQSxTQUFTLFdBQVcsQ0FBQyxJQUFzQjtFQUN2QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYTtFQUNqQyxJQUFJLEVBQUUsTUFBTSxZQUFZLGdCQUFnQixDQUFDLEVBQUU7SUFDdkMsT0FBTyxFQUFFOztFQUViLEtBQUssSUFBSSxVQUFVLEdBQUcsQ0FBQyxFQUFFLFVBQVUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRTtJQUN4RSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFO01BQ3RDOztJQUVKLE1BQU0sb0JBQW9CLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO0lBQzVELElBQUksRUFBRSxvQkFBb0IsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO01BQ3JEOztJQUVKLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUUsQ0FBQyxJQUE0QixDQUFDLFlBQVksZ0JBQWdCLENBQUM7O0VBRXhILE9BQU8sRUFBRTtBQUNiO0FBRUEsU0FBUyx5QkFBeUIsQ0FBQyxJQUFzQjtFQUNyRCxLQUFLLE1BQU0sS0FBSyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUNuQyxJQUFJLEtBQUssQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRTtNQUNoQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPO01BQzVCLEtBQUssQ0FBQyxhQUFhLEdBQUcsS0FBSztNQUMzQix5QkFBeUIsQ0FBQyxLQUFLLENBQUM7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UixJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU87Y0FDbkI7WUFDSixLQUFLLFFBQVE7Y0FDVCxJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVE7Y0FDcEI7WUFDSixLQUFLLE1BQU07Y0FDUCxJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU87Y0FDbkI7WUFDSixLQUFLLE1BQU07Y0FDUCxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU07Y0FDbEI7WUFDSixLQUFLLEtBQUs7Y0FDTixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUs7Y0FDakI7WUFDSjtjQUNJLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEtBQUssRUFBRSxDQUFDO1VBQUM7VUFFcEQ7UUFDSixLQUFLLE9BQU87VUFDUixJQUFJLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDNUI7UUFDSixLQUFLLEtBQUs7VUFDTixJQUFJLENBQUMsR0FBRyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDMUI7UUFDSixLQUFLLEtBQUs7VUFDTixJQUFJLENBQUMsR0FBRyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDMUI7UUFDSixLQUFLLEtBQUs7VUFDTixJQUFJLENBQUMsR0FBRyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDMUI7UUFDSixLQUFLLEtBQUs7VUFDTixJQUFJLENBQUMsR0FBRyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDMUI7UUFDSixLQUFLLE9BQU87VUFDUixJQUFJLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDekI7UUFDSixLQUFLLFVBQVU7VUFDWCxJQUFJLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDakM7UUFDSixLQUFLLFNBQVM7VUFDVixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDaEM7UUFDSixLQUFLLFlBQVk7VUFDYixJQUFJLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDNUI7UUFDSixL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O01BQ3RCLFFBQVEsSUFBSTtRQUNSLEtBQUssZ0JBQWdCO1VBQ2pCLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFTLEVBQUUsR0FBUyxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztVQUMvRTtRQUNKLEtBQUssUUFBUTtVQUNULFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFTLEVBQUUsR0FBUyxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztVQUMzRTtRQUNKLEtBQUssS0FBSztVQUNOLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFTLEVBQUUsR0FBUyxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztVQUNyRTtRQUNKLEtBQUssS0FBSztVQUNOLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFTLEVBQUUsR0FBUyxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztVQUNyRTtRQUNKLEtBQUssS0FBSztVQUNOLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFTLEVBQUUsR0FBUyxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztVQUNyRTtRQUNKLEtBQUssS0FBSztVQUNOLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFTLEVBQUUsR0FBUyxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztVQUNyRTtRQUNKLEtBQUssTUFBTTtVQUNQLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFTLEVBQUUsR0FBUyxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztVQUNyRTtRQUNKLEtBQUssT0FBTztVQUNSLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFTLEVBQUUsR0FBUyxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztVQUN6RTtRQUNKLEtBQUssWUFBWTtVQUNiLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFTLEVBQUUsR0FBUyxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztVQUNuRjtRQUNKLEtBQUssV0FBVztVQUNaLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFTLEVBQUUsR0FBUyxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztVQUNqRjtRQUNKLEtBQUssSUFBSTtVQUNMLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFTLEVBQUUsR0FBUyxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztVQUNuRTtRQUNKO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtNQUFBOzs7O0VBS1osTUFBTSxLQUFLLEdBQUcsK0JBQWUsRUFDekIsSUFBSSxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUM3QyxVQUFVLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQy9ELENBQUMsS0FBSyxFQUFFLElBQUksS0FBSTtJQUNaLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7TUFDcEIsT0FBTyxDQUFDLElBQUksQ0FBQzs7SUFFakIsS0FBSyxNQUFNLFVBQVUsSUFBSSxXQUFXLEVBQUU7TUFDbEMsUUFBUSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQztRQUM5QixLQUFLLENBQUMsQ0FBQztVQUNILE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDakIsS0FBSyxDQUFDO1VBQ0YsT0FBTyxLQUFLO01BQUM7O0lBR3pCLE9BQU8sQ0FBQyxHQUFHLEtBQUssRUFBRSxJQUFJLENBQUM7RUFDM0IsQ0FBQyxDQUNKO0VBQ0QsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUM7RUFDakQsSUFBSSxDQUFDLE1BQU0sRUFBRTtJQUNUOztFQUVKLE1BQU0sQ0FBQyxTQUFTLEdBQUcsRUFBRTtFQUNyQixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztBQUM3QjtBQUVBLFNBQVMsd0JBQXdCO0VBQzdCLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDO0VBQzVELElBQUksRUFBRSxZQUFZLFlBQVksZ0JBQWdCLENBQUMsRUFBRTtJQUM3QyxNQUFNLGdCQUFnQjs7RUFFMUIsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUM7RUFDeEQsSUFBSSxFQUFFLFVBQVUsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO0lBQzNDLE1BQU0sZ0JBQWdCOztFQUUxQixNQUFNLFFBQVEsR0FBRyxNQUFLO0lBQ2xCLFlBQVksQ0FBQyxXQUFXLEdBQUcsMEJBQTBCLFVBQVUsQ0FBQyxLQUFLLEVBQUU7SUFDdkUsYUFBYSxFQUFFO0VBQ25CLENBQUM7RUFDRCxVQUFVLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQztFQUM5QyxRQUFRLEVBQUU7QUFDZDtBQUVBLFNBQVMsaUJBQWlCO0VBQ3RCLHdCQUF3QixFQUFFO0VBQzFCLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDO0VBQ3hELElBQUksRUFBRSxVQUFVLFlBQVksV0FBVyxDQUFDLEVBQUU7SUFDdEMsTUFBTSxnQkFBZ0I7O0VBRTFCLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDO0FBQ3ZEO0FBRUEsaUJBQWlCLEVBQUU7QUFFbkIsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxZQUFXO0VBQ3ZDLE1BQU0sNkJBQWEsR0FBRTtFQUNyQixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO0lBQ3RFLElBQUksT0FBTyxZQUFZLFdBQVcsRUFBRTtNQUNoQyxPQUFPLENBQUMsTUFBTSxHQUFHLEtBQUs7OztFQUc5QixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO0lBQ3RFLElBQUksT0FBTyxZQUFZLFdBQVcsRUFBRTtNQUNoQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNOzs7RUFHdEMsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUM7RUFDeEQsSUFBSSxFQUFFLFVBQVUsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO0lBQzNDLE1BQU0sZ0JBQWdCOztFQUUxQixVQUFVLENBQUMsR0FBRyxHQUFHLEdBQUcsK0JBQWUsR0FBRSxFQUFFO0VBQ3ZDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLEdBQUc7RUFDakMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztFQUM1QyxhQUFhLEVBQUU7QUFDbkIsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHsgY3JlYXRlSFRNTCB9IGZyb20gJy4vaHRtbCc7XG5cbmV4cG9ydCB0eXBlIFRyZWVOb2RlID0gc3RyaW5nIHwgVHJlZU5vZGVbXTtcblxuZnVuY3Rpb24gZ2V0Q2hpbGRyZW4obm9kZTogSFRNTElucHV0RWxlbWVudCk6IEhUTUxJbnB1dEVsZW1lbnRbXSB7XG4gICAgY29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuICAgIGlmICghKHBhcmVudCBpbnN0YW5jZW9mIEhUTUxVTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgZm9yIChsZXQgY2hpbGRJbmRleCA9IDA7IGNoaWxkSW5kZXggPCBwYXJlbnQuY2hpbGRyZW4ubGVuZ3RoOyBjaGlsZEluZGV4KyspIHtcbiAgICAgICAgaWYgKHBhcmVudC5jaGlsZHJlbltjaGlsZEluZGV4XSAhPT0gbm9kZSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcG90ZW50aWFsU2libGluZ0xpc3QgPSBwYXJlbnQuY2hpbGRyZW5bY2hpbGRJbmRleCArIDNdO1xuICAgICAgICBpZiAoIShwb3RlbnRpYWxTaWJsaW5nTGlzdCBpbnN0YW5jZW9mIEhUTUxVTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShwb3RlbnRpYWxTaWJsaW5nTGlzdC5jaGlsZHJlbikuZmlsdGVyKChlKTogZSBpcyBIVE1MSW5wdXRFbGVtZW50ID0+IGUgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIFtdO1xufVxuXG5mdW5jdGlvbiBhcHBseUNoZWNrZWRUb0Rlc2NlbmRhbnRzKG5vZGU6IEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGdldENoaWxkcmVuKG5vZGUpKSB7XG4gICAgICAgIGlmIChjaGlsZC5jaGVja2VkICE9PSBub2RlLmNoZWNrZWQpIHtcbiAgICAgICAgICAgIGNoaWxkLmNoZWNrZWQgPSBub2RlLmNoZWNrZWQ7XG4gICAgICAgICAgICBjaGlsZC5pbmRldGVybWluYXRlID0gZmFsc2U7XG4gICAgICAgICAgICBhcHBseUNoZWNrZWRUb0Rlc2NlbmRhbnRzKGNoaWxkKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0UGFyZW50KG5vZGU6IEhUTUxJbnB1dEVsZW1lbnQpOiBIVE1MSW5wdXRFbGVtZW50IHwgdm9pZCB7XG4gICAgY29uc3QgcGFyZW50VUwgPSBub2RlLnBhcmVudEVsZW1lbnQ7XG4gICAgaWYgKCEocGFyZW50VUwgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGdyYW5kcGFyZW50VUwgPSBwYXJlbnRVTC5wYXJlbnRFbGVtZW50O1xuICAgIGlmICghKGdyYW5kcGFyZW50VUwgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBjYW5kaWRhdGU6IEhUTUxJbnB1dEVsZW1lbnQgfCB2b2lkO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZ3JhbmRwYXJlbnRVTC5jaGlsZHJlbikge1xuICAgICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICBjYW5kaWRhdGUgPSBjaGlsZDtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGlsZCA9PT0gcGFyZW50VUwpIHtcbiAgICAgICAgICAgIHJldHVybiBjYW5kaWRhdGU7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUFuY2VzdG9ycyhub2RlOiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgY29uc3QgcGFyZW50ID0gZ2V0UGFyZW50KG5vZGUpO1xuICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IGZvdW5kQ2hlY2tlZCA9IGZhbHNlO1xuICAgIGxldCBmb3VuZFVuY2hlY2tlZCA9IGZhbHNlO1xuICAgIGxldCBmb3VuZEluZGV0ZXJtaW5hdGUgPSBmYWxzZVxuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZ2V0Q2hpbGRyZW4ocGFyZW50KSkge1xuICAgICAgICBpZiAoY2hpbGQuY2hlY2tlZCkge1xuICAgICAgICAgICAgZm91bmRDaGVja2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvdW5kVW5jaGVja2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hpbGQuaW5kZXRlcm1pbmF0ZSkge1xuICAgICAgICAgICAgZm91bmRJbmRldGVybWluYXRlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoZm91bmRJbmRldGVybWluYXRlIHx8IGZvdW5kQ2hlY2tlZCAmJiBmb3VuZFVuY2hlY2tlZCkge1xuICAgICAgICBwYXJlbnQuaW5kZXRlcm1pbmF0ZSA9IHRydWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKGZvdW5kQ2hlY2tlZCkge1xuICAgICAgICBwYXJlbnQuY2hlY2tlZCA9IHRydWU7XG4gICAgICAgIHBhcmVudC5pbmRldGVybWluYXRlID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2UgaWYgKGZvdW5kVW5jaGVja2VkKSB7XG4gICAgICAgIHBhcmVudC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgIHBhcmVudC5pbmRldGVybWluYXRlID0gZmFsc2U7XG4gICAgfVxuICAgIHVwZGF0ZUFuY2VzdG9ycyhwYXJlbnQpO1xufVxuXG5mdW5jdGlvbiBhcHBseUNoZWNrTGlzdGVuZXIobm9kZTogSFRNTElucHV0RWxlbWVudCkge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgaWYgKCEodGFyZ2V0IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhcHBseUNoZWNrZWRUb0Rlc2NlbmRhbnRzKHRhcmdldCk7XG4gICAgICAgIHVwZGF0ZUFuY2VzdG9ycyh0YXJnZXQpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBhcHBseUNoZWNrTGlzdGVuZXJzKG5vZGU6IEhUTUxVTGlzdEVsZW1lbnQpIHtcbiAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGFwcGx5Q2hlY2tMaXN0ZW5lcihlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChlbGVtZW50IGluc3RhbmNlb2YgSFRNTFVMaXN0RWxlbWVudCkge1xuICAgICAgICAgICAgYXBwbHlDaGVja0xpc3RlbmVycyhlbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbWFrZUNoZWNrYm94VHJlZU5vZGUodHJlZU5vZGU6IFRyZWVOb2RlKTogW0hUTUxJbnB1dEVsZW1lbnQsIEhUTUxMYWJlbEVsZW1lbnRdIHwgW0hUTUxVTGlzdEVsZW1lbnRdIHtcbiAgICBpZiAodHlwZW9mIHRyZWVOb2RlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGxldCBkaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICBpZiAodHJlZU5vZGVbMF0gPT09IFwiLVwiKSB7XG4gICAgICAgICAgICB0cmVlTm9kZSA9IHRyZWVOb2RlLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgIGRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5vZGU6IFtIVE1MSW5wdXRFbGVtZW50LCBIVE1MTGFiZWxFbGVtZW50XSA9IFtcbiAgICAgICAgICAgIGNyZWF0ZUhUTUwoW1wiaW5wdXRcIiwgeyB0eXBlOiBcImNoZWNrYm94XCIsIGlkOiB0cmVlTm9kZSwgY2hlY2tlZDogXCJ0cnVlXCIgfV0pLFxuICAgICAgICAgICAgY3JlYXRlSFRNTChbXCJsYWJlbFwiLCB7IGZvcjogdHJlZU5vZGUgfSwgdHJlZU5vZGVdKVxuICAgICAgICBdO1xuICAgICAgICBpZiAoZGlzYWJsZWQpIHtcbiAgICAgICAgICAgIG5vZGVbMF0uY2xhc3NMaXN0LmFkZChcImRpc2FibGVkXCIpO1xuICAgICAgICAgICAgbm9kZVsxXS5jbGFzc0xpc3QuYWRkKFwiZGlzYWJsZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBsaXN0ID0gY3JlYXRlSFRNTChbXCJ1bFwiXSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdHJlZU5vZGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0cmVlTm9kZVtpXTtcbiAgICAgICAgICAgIGNvbnN0IGxhc3QgPSBpID09PSB0cmVlTm9kZS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgZm9yIChjb25zdCBlIG9mIG1ha2VDaGVja2JveFRyZWVOb2RlKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgbGlzdC5hcHBlbmRDaGlsZChlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghbGFzdCAmJiB0eXBlb2Ygbm9kZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIGxpc3QuYXBwZW5kQ2hpbGQoY3JlYXRlSFRNTChbXCJiclwiXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbbGlzdF07XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZUNoZWNrYm94VHJlZSh0cmVlTm9kZTogVHJlZU5vZGUpIHtcbiAgICBsZXQgcm9vdCA9IG1ha2VDaGVja2JveFRyZWVOb2RlKHRyZWVOb2RlKVswXTtcbiAgICBpZiAoIShyb290IGluc3RhbmNlb2YgSFRNTFVMaXN0RWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgIH1cbiAgICByb290LmNsYXNzTGlzdC5hZGQoXCJ0cmVldmlld1wiKTtcbiAgICBhcHBseUNoZWNrTGlzdGVuZXJzKHJvb3QpO1xuICAgIHJldHVybiByb290O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGVhZlN0YXRlcyhub2RlOiBIVE1MVUxpc3RFbGVtZW50KSB7XG4gICAgbGV0IHN0YXRlczogeyBba2V5OiBzdHJpbmddOiBib29sZWFuIH0gPSB7fTtcbiAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGlmIChnZXRDaGlsZHJlbihlbGVtZW50KS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBzdGF0ZXNbZWxlbWVudC5pZF0gPSBlbGVtZW50LmNoZWNrZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxVTGlzdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHN0YXRlcyA9IHsgLi4uc3RhdGVzLCAuLi5nZXRMZWFmU3RhdGVzKGVsZW1lbnQpIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN0YXRlcztcbn0iLCJ0eXBlIFRhZ19uYW1lID0ga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwO1xudHlwZSBBdHRyaWJ1dGVzID0geyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcbnR5cGUgSFRNTF9ub2RlPFQgZXh0ZW5kcyBUYWdfbmFtZT4gPSBbVCwgLi4uKEhUTUxfbm9kZTxUYWdfbmFtZT4gfCBIVE1MRWxlbWVudCB8IHN0cmluZyB8IEF0dHJpYnV0ZXMpW11dO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSFRNTDxUIGV4dGVuZHMgVGFnX25hbWU+KG5vZGU6IEhUTUxfbm9kZTxUPik6IEhUTUxFbGVtZW50VGFnTmFtZU1hcFtUXSB7XG4gICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZVswXSk7XG4gICAgZnVuY3Rpb24gaGFuZGxlKHBhcmFtZXRlcjogQXR0cmlidXRlcyB8IEhUTUxfbm9kZTxUYWdfbmFtZT4gfCBIVE1MRWxlbWVudCB8IHN0cmluZykge1xuICAgICAgICBpZiAodHlwZW9mIHBhcmFtZXRlciA9PT0gXCJzdHJpbmdcIiB8fCBwYXJhbWV0ZXIgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQocGFyYW1ldGVyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KHBhcmFtZXRlcikpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKGNyZWF0ZUhUTUwocGFyYW1ldGVyKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBwYXJhbWV0ZXIpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIHBhcmFtZXRlcltrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IG5vZGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaGFuZGxlKG5vZGVbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudDtcbn1cbiIsImltcG9ydCB7IGNyZWF0ZUhUTUwgfSBmcm9tICcuL2h0bWwnO1xuXG5leHBvcnQgdHlwZSBDaGFyYWN0ZXIgPSBcIk5pa2lcIiB8IFwiTHVuTHVuXCIgfCBcIkx1Y3lcIiB8IFwiU2h1YVwiIHwgXCJEaGFucGlyXCIgfCBcIlBvY2hpXCIgfCBcIkFsXCI7XG5cbmV4cG9ydCB0eXBlIFBhcnQgPSBcIkhhdFwiIHwgXCJIYWlyXCIgfCBcIkR5ZVwiIHwgXCJVcHBlclwiIHwgXCJMb3dlclwiIHwgXCJTaG9lc1wiIHwgXCJTb2Nrc1wiIHwgXCJIYW5kXCIgfCBcIkJhY2twYWNrXCIgfCBcIkZhY2VcIiB8IFwiUmFja2V0XCI7XG5cbmV4cG9ydCBjbGFzcyBJdGVtU291cmNlIHtcbiAgICBjb25zdHJ1Y3RvcihpdGVtX25hbWU6IHN0cmluZywgcHJpY2U6IG51bWJlciwgYXA6IGJvb2xlYW4gPSBmYWxzZSwgZ2FjaGFfZmFjdG9yOiBudW1iZXIgPSAwKSB7XG4gICAgICAgIHRoaXMuaXRlbV9uYW1lID0gaXRlbV9uYW1lO1xuICAgICAgICB0aGlzLnByaWNlID0gcHJpY2U7XG4gICAgICAgIGlmIChhcCkge1xuICAgICAgICAgICAgdGhpcy5wcmljZSAqPSAtMTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmdhY2hhX2ZhY3RvciA9IGdhY2hhX2ZhY3RvcjtcbiAgICB9XG4gICAgZGlzcGxheV9zdHJpbmcoKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKHRoaXMucHJpY2UpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbmN5ID0gdGhpcy5pc19hcCA/IFwiQVBcIiA6IFwiR29sZFwiO1xuICAgICAgICAgICAgY29uc3QgcHJpY2UgPSBNYXRoLmFicyh0aGlzLnByaWNlKTtcbiAgICAgICAgICAgIHJldHVybiBgJHt0aGlzLml0ZW1fbmFtZSA/IGBcIiR7dGhpcy5pdGVtX25hbWV9XCIgYCA6IFwiXCJ9U2hvcCAke3ByaWNlfSAke2N1cnJlbmN5fSR7dGhpcy5nYWNoYV9mYWN0b3IgPyBgIHggJHt0aGlzLmdhY2hhX2ZhY3Rvcn0g4omIICR7dGhpcy5nYWNoYV9mYWN0b3IgKiBwcmljZX0gJHtjdXJyZW5jeX1gIDogXCJcIn1gO1xuICAgICAgICB9XG4gICAgICAgIGxldCBnZiA9IHRoaXMuZ2FjaGFfZmFjdG9yLnRvRml4ZWQoMSk7XG4gICAgICAgIGlmIChnZi5lbmRzV2l0aChcIi4wXCIpKSB7XG4gICAgICAgICAgICBnZiA9IGdmLnN1YnN0cmluZygwLCBnZi5sZW5ndGggLSAyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYCR7dGhpcy5pdGVtX25hbWV9IHggJHtnZn1gO1xuICAgIH1cbiAgICBnZXQgaXNfYXAoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLnByaWNlIDwgMDtcbiAgICB9XG4gICAgZ2V0IGlzX2dvbGQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLnByaWNlID4gMDtcbiAgICB9XG4gICAgZ2V0IGlzX2dhY2hhKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5nYWNoYV9mYWN0b3IgIT09IDA7XG4gICAgfVxuICAgIGl0ZW1fbmFtZTogc3RyaW5nO1xuICAgIHByaWNlOiBudW1iZXI7XG4gICAgZ2FjaGFfZmFjdG9yOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBJdGVtIHtcbiAgICBpZCA9IDA7XG4gICAgbmFtZV9rciA9IFwiXCI7XG4gICAgbmFtZV9lbiA9IFwiXCI7XG4gICAgbmFtZV9zaG9wID0gXCJcIjtcbiAgICB1c2VUeXBlID0gXCJcIjtcbiAgICBtYXhVc2UgPSAwO1xuICAgIGhpZGRlbiA9IGZhbHNlO1xuICAgIHJlc2lzdCA9IFwiXCI7XG4gICAgY2hhcmFjdGVyOiBDaGFyYWN0ZXIgPSBcIk5pa2lcIjtcbiAgICBwYXJ0OiBQYXJ0ID0gXCJIYXRcIjtcbiAgICBsZXZlbCA9IDA7XG4gICAgc3RyID0gMDtcbiAgICBzdGEgPSAwO1xuICAgIGRleCA9IDA7XG4gICAgd2lsID0gMDtcbiAgICBocCA9IDA7XG4gICAgcXVpY2tzbG90cyA9IDA7XG4gICAgYnVmZnNsb3RzID0gMDtcbiAgICBzbWFzaCA9IDA7XG4gICAgbW92ZW1lbnQgPSAwO1xuICAgIGNoYXJnZSA9IDA7XG4gICAgbG9iID0gMDtcbiAgICBzZXJ2ZSA9IDA7XG4gICAgbWF4X3N0ciA9IDA7XG4gICAgbWF4X3N0YSA9IDA7XG4gICAgbWF4X2RleCA9IDA7XG4gICAgbWF4X3dpbCA9IDA7XG4gICAgZWxlbWVudF9lbmNoYW50YWJsZSA9IGZhbHNlO1xuICAgIHBhcmNlbF9lbmFibGVkID0gZmFsc2U7XG4gICAgcGFyY2VsX2Zyb21fc2hvcCA9IGZhbHNlO1xuICAgIHNwaW4gPSAwO1xuICAgIGF0c3MgPSAwO1xuICAgIGRmc3MgPSAwO1xuICAgIHNvY2tldCA9IDA7XG4gICAgZ2F1Z2UgPSAwO1xuICAgIGdhdWdlX2JhdHRsZSA9IDA7XG4gICAgc291cmNlczogSXRlbVNvdXJjZVtdID0gW11cbn1cblxubGV0IGl0ZW1zID0gbmV3IE1hcDxudW1iZXIsIEl0ZW0+KCk7XG5sZXQgc2hvcF9pdGVtcyA9IG5ldyBNYXA8bnVtYmVyLCBJdGVtPigpO1xubGV0IGdhY2hhczogeyBuYW1lOiBzdHJpbmcsIGlkOiBudW1iZXIgfVtdID0gW107XG5cbmZ1bmN0aW9uIHBhcnNlSXRlbURhdGEoZGF0YTogc3RyaW5nKSB7XG4gICAgaWYgKGRhdGEubGVuZ3RoIDwgMTAwMCkge1xuICAgICAgICBjb25zb2xlLndhcm4oYEl0ZW1zIGZpbGUgaXMgb25seSAke2RhdGEubGVuZ3RofSBieXRlcyBsb25nYCk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgWywgcmVzdWx0XSBvZiBkYXRhLm1hdGNoQWxsKC9cXDxJdGVtICguKilcXC9cXD4vZykpIHtcbiAgICAgICAgY29uc3QgaXRlbTogSXRlbSA9IG5ldyBJdGVtO1xuICAgICAgICBmb3IgKGNvbnN0IFssIGF0dHJpYnV0ZSwgdmFsdWVdIG9mIHJlc3VsdC5tYXRjaEFsbCgvXFxzPyhbXj1dKik9XCIoW15cIl0qKVwiL2cpKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGF0dHJpYnV0ZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJJbmRleFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmlkID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiX05hbWVfXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ubmFtZV9rciA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiTmFtZV9OXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ubmFtZV9lbiA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiVXNlVHlwZVwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnVzZVR5cGUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIk1heFVzZVwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLm1heFVzZSA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkhpZGVcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5oaWRkZW4gPSAhIXBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlJlc2lzdFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnJlc2lzdCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiQ2hhclwiOlxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTklLSVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hhcmFjdGVyID0gXCJOaWtpXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTFVOTFVOXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGFyYWN0ZXIgPSBcIkx1bkx1blwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxVQ1lcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNoYXJhY3RlciA9IFwiTHVjeVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlNIVUFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNoYXJhY3RlciA9IFwiU2h1YVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkRIQU5QSVJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNoYXJhY3RlciA9IFwiRGhhbnBpclwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlBPQ0hJXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGFyYWN0ZXIgPSBcIlBvY2hpXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQUxcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNoYXJhY3RlciA9IFwiQWxcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBGb3VuZCB1bmtub3duIGNoYXJhY3RlciBcIiR7dmFsdWV9XCJgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiUGFydFwiOlxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKFN0cmluZyh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJCQUdcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcnQgPSBcIkJhY2twYWNrXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiR0xBU1NFU1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucGFydCA9IFwiRmFjZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkhBTkRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcnQgPSBcIkhhbmRcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJTT0NLU1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucGFydCA9IFwiU29ja3NcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJGT09UXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJTaG9lc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkNBUFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucGFydCA9IFwiSGF0XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUEFOVFNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcnQgPSBcIkxvd2VyXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUkFDS0VUXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJSYWNrZXRcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJCT0RZXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJVcHBlclwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkhBSVJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcnQgPSBcIkhhaXJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJEWUVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcnQgPSBcIkR5ZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEZvdW5kIHVua25vd24gcGFydCAke3ZhbHVlfWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJMZXZlbFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmxldmVsID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiU1RSXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uc3RyID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiU1RBXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uc3RhID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiREVYXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZGV4ID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiV0lMXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ud2lsID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiQWRkSFBcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5ocCA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkFkZFF1aWNrXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ucXVpY2tzbG90cyA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkFkZEJ1ZmZcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5idWZmc2xvdHMgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJTbWFzaFNwZWVkXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uc21hc2ggPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJNb3ZlU3BlZWRcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5tb3ZlbWVudCA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkNoYXJnZXNob3RTcGVlZFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmNoYXJnZSA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkxvYlNwZWVkXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ubG9iID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiU2VydmVTcGVlZFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnNlcnZlID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiTUFYX1NUUlwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLm1heF9zdHIgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJNQVhfU1RBXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ubWF4X3N0YSA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIk1BWF9ERVhcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5tYXhfZGV4ID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiTUFYX1dJTFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLm1heF93aWwgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJFbmNoYW50RWxlbWVudFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmVsZW1lbnRfZW5jaGFudGFibGUgPSAhIXBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkVuYWJsZVBhcmNlbFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcmNlbF9lbmFibGVkID0gISFwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJCYWxsU3BpblwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnNwaW4gPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJBVFNTXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uYXRzcyA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkRGU1NcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kZnNzID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiU29ja2V0XCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uc29ja2V0ID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiR2F1Z2VcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5nYXVnZSA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkdhdWdlQmF0dGxlXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZ2F1Z2VfYmF0dGxlID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEZvdW5kIHVua25vd24gaXRlbSBhdHRyaWJ1dGUgXCIke2F0dHJpYnV0ZX1cImApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGl0ZW1zLnNldChpdGVtLmlkLCBpdGVtKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhcnNlU2hvcERhdGEoZGF0YTogc3RyaW5nKSB7XG4gICAgY29uc3QgZGVidWdTaG9wUGFyc2luZyA9IGZhbHNlO1xuICAgIGlmIChkYXRhLmxlbmd0aCA8IDEwMDApIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBTaG9wIGZpbGUgaXMgb25seSAke2RhdGEubGVuZ3RofSBieXRlcyBsb25nYCk7XG4gICAgfVxuICAgIGxldCBjb3VudCA9IDA7XG4gICAgbGV0IGN1cnJlbnRJbmRleCA9IDA7XG4gICAgZm9yIChjb25zdCBtYXRjaCBvZiBkYXRhLm1hdGNoQWxsKC88UHJvZHVjdCBESVNQTEFZPVwiXFxkK1wiIEhJVF9ESVNQTEFZPVwiXFxkK1wiIEluZGV4PVwiKD88aW5kZXg+XFxkKylcIiBFbmFibGU9XCIoPzxlbmFibGVkPjB8MSlcIiBOZXc9XCJcXGQrXCIgSGl0PVwiXFxkK1wiIEZyZWU9XCJcXGQrXCIgU2FsZT1cIlxcZCtcIiBFdmVudD1cIlxcZCtcIiBDb3VwbGU9XCJcXGQrXCIgTm9idXk9XCJcXGQrXCIgUmFuZD1cIlteXCJdK1wiIFVzZVR5cGU9XCJbXlwiXStcIiBVc2UwPVwiXFxkK1wiIFVzZTE9XCJcXGQrXCIgVXNlMj1cIlxcZCtcIiBQcmljZVR5cGU9XCIoPzxwcmljZV90eXBlPig/Ok1JTlQpfCg/OkdPTEQpKVwiIE9sZFByaWNlMD1cIi0/XFxkK1wiIE9sZFByaWNlMT1cIi0/XFxkK1wiIE9sZFByaWNlMj1cIi0/XFxkK1wiIFByaWNlMD1cIig/PHByaWNlPi0/XFxkKylcIiBQcmljZTE9XCItP1xcZCtcIiBQcmljZTI9XCItP1xcZCtcIiBDb3VwbGVQcmljZT1cIi0/XFxkK1wiIENhdGVnb3J5PVwiKD88Y2F0ZWdvcnk+W15cIl0qKVwiIE5hbWU9XCIoPzxuYW1lPlteXCJdKilcIiBHb2xkQmFjaz1cIi0/XFxkK1wiIEVuYWJsZVBhcmNlbD1cIig/PHBhcmNlbF9mcm9tX3Nob3A+MHwxKVwiIENoYXI9XCItP1xcZCtcIiBJdGVtMD1cIig/PGl0ZW0wPi0/XFxkKylcIiBJdGVtMT1cIig/PGl0ZW0xPi0/XFxkKylcIiBJdGVtMj1cIig/PGl0ZW0yPi0/XFxkKylcIiBJdGVtMz1cIig/PGl0ZW0zPi0/XFxkKylcIiBJdGVtND1cIig/PGl0ZW00Pi0/XFxkKylcIiBJdGVtNT1cIig/PGl0ZW01Pi0/XFxkKylcIiBJdGVtNj1cIig/PGl0ZW02Pi0/XFxkKylcIiBJdGVtNz1cIig/PGl0ZW03Pi0/XFxkKylcIiBJdGVtOD1cIig/PGl0ZW04Pi0/XFxkKylcIiBJdGVtOT1cIig/PGl0ZW05Pi0/XFxkKylcIiA/KD86SWNvbj1cIlteXCJdKlwiID8pPyg/Ok5hbWVfa3I9XCJbXlwiXSpcIiA/KT8oPzpOYW1lX2VuPVwiKD88bmFtZV9lbj5bXlwiXSopXCIgPyk/KD86TmFtZV90aD1cIlteXCJdKlwiID8pP1xcLz4vZykpIHtcbiAgICAgICAgaWYgKCFtYXRjaC5ncm91cHMpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGluZGV4ID0gcGFyc2VJbnQobWF0Y2guZ3JvdXBzLmluZGV4KTtcbiAgICAgICAgaWYgKGN1cnJlbnRJbmRleCArIDEgIT09IGluZGV4KSB7XG4gICAgICAgICAgICBkZWJ1Z1Nob3BQYXJzaW5nICYmIGNvbnNvbGUud2FybihgRmFpbGVkIHBhcnNpbmcgc2hvcCBpdGVtIGluZGV4ICR7Y3VycmVudEluZGV4ICsgMiA9PT0gaW5kZXggPyBjdXJyZW50SW5kZXggKyAxIDogYCR7Y3VycmVudEluZGV4ICsgMX0gdG8gJHtpbmRleCAtIDF9YH1gKTtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50SW5kZXggPSBpbmRleDtcbiAgICAgICAgY29uc3QgbmFtZSA9IG1hdGNoLmdyb3Vwcy5uYW1lO1xuICAgICAgICBjb25zdCBjYXRlZ29yeSA9IG1hdGNoLmdyb3Vwcy5jYXRlZ29yeTtcbiAgICAgICAgaWYgKGNhdGVnb3J5ID09PSBcIkxPVFRFUllcIikge1xuICAgICAgICAgICAgZ2FjaGFzLnB1c2goeyBuYW1lOiBuYW1lLCBpZDogcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW0wKSB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBlbmFibGVkID0gISFwYXJzZUludChtYXRjaC5ncm91cHMuZW5hYmxlZCk7XG4gICAgICAgIGNvbnN0IHByaWNlX3R5cGU6IFwiYXBcIiB8IFwiZ29sZFwiIHwgXCJub25lXCIgPSBtYXRjaC5ncm91cHMucHJpY2VfdHlwZSA9PT0gXCJNSU5UXCIgPyBcImFwXCIgOiBtYXRjaC5ncm91cHMucHJpY2VfdHlwZSA9PT0gXCJHT0xEXCIgPyBcImdvbGRcIiA6IFwibm9uZVwiO1xuICAgICAgICBjb25zdCBwcmljZSA9IHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5wcmljZSk7XG4gICAgICAgIGNvbnN0IHBhcmNlbF9mcm9tX3Nob3AgPSAhIXBhcnNlSW50KG1hdGNoLmdyb3Vwcy5wYXJjZWxfZnJvbV9zaG9wKTtcbiAgICAgICAgY29uc3QgaXRlbUlEcyA9IFtcbiAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5pdGVtMCksXG4gICAgICAgICAgICBwYXJzZUludChtYXRjaC5ncm91cHMuaXRlbTEpLFxuICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW0yKSxcbiAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5pdGVtMyksXG4gICAgICAgICAgICBwYXJzZUludChtYXRjaC5ncm91cHMuaXRlbTQpLFxuICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW01KSxcbiAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5pdGVtNiksXG4gICAgICAgICAgICBwYXJzZUludChtYXRjaC5ncm91cHMuaXRlbTcpLFxuICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW04KSxcbiAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5pdGVtOSksXG4gICAgICAgIF07XG4gICAgICAgIGZvciAoY29uc3QgaXRlbUlEIG9mIGl0ZW1JRHMpIHtcbiAgICAgICAgICAgIGlmIChpdGVtSUQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBvbGRJdGVtID0gaXRlbXMuZ2V0KGl0ZW1JRCk7XG4gICAgICAgICAgICBjb25zdCBuZXdJdGVtID0gbmV3IEl0ZW0oKTtcbiAgICAgICAgICAgIG5ld0l0ZW0ubmFtZV9lbiA9IG1hdGNoLmdyb3Vwcy5uYW1lX2VuID8/IFwiXCI7XG4gICAgICAgICAgICAvL3RvZG86IGZpbGwgcmVzdCBvZiBpdGVtXG4gICAgICAgICAgICBpZiAoIW9sZEl0ZW0pIHtcbiAgICAgICAgICAgICAgICBvbGRJdGVtID0gbmV3SXRlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjYXRlZ29yeSA9PT0gXCJQQVJUU1wiKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgb2xkSXRlbS5zb3VyY2VzLnB1c2gobmV3IEl0ZW1Tb3VyY2UobmFtZSA9PT0gbmV3SXRlbS5uYW1lX2VuID8gXCJcIiA6IG5hbWUsIHByaWNlLCBwcmljZV90eXBlID09PSBcImFwXCIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2hvcF9pdGVtcy5zZXQoaW5kZXgsIG9sZEl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2hvcF9pdGVtcy5zZXQoaW5kZXgsIG5ld0l0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvdW50Kys7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKGBGb3VuZCAke2NvdW50fSBzaG9wIGl0ZW1zYCk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlR2FjaGFEYXRhKGRhdGE6IHN0cmluZywgbmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZ2FjaGFfcmVzdWx0czogeyBpZDogbnVtYmVyLCBjaGFuY2U6IG51bWJlciB9W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IG1hdGNoIG9mIGRhdGEubWF0Y2hBbGwoLzxMb3R0ZXJ5SXRlbV9bXiBdKiBJbmRleD1cIlxcZCtcIiBfTmFtZV89XCJbXlwiXSpcIiBTaG9wSW5kZXg9XCIoPzxzaG9wX2lkPlxcZCspXCIgUXVhbnRpdHlNaW49XCJcXGQrXCIgUXVhbnRpdHlNYXg9XCJcXGQrXCIgQ2hhbnNQZXI9XCIoPzxwcm9iYWJpbGl0eT5cXGQrXFwuP1xcZCopXCIgRWZmZWN0PVwiXFxkK1wiIFByb2R1Y3RPcHQ9XCJcXGQrXCJcXC8+L2cpKSB7XG4gICAgICAgIGlmICghbWF0Y2guZ3JvdXBzKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBnYWNoYV9yZXN1bHRzLnB1c2goeyBpZDogcGFyc2VJbnQobWF0Y2guZ3JvdXBzLnNob3BfaWQpLCBjaGFuY2U6IHBhcnNlRmxvYXQobWF0Y2guZ3JvdXBzLnByb2JhYmlsaXR5KSB9KTtcbiAgICB9XG4gICAgY29uc3QgdG90YWxfcHJvYmFiaWxpdHkgPSBnYWNoYV9yZXN1bHRzLm1hcChnYWNoYV9yZXN1bHQgPT4gZ2FjaGFfcmVzdWx0LmNoYW5jZSkucmVkdWNlKChwcmV2LCBjdXJyKSA9PiBwcmV2ICsgY3VyciwgMCk7XG4gICAgZm9yIChjb25zdCBnYWNoYV9yZXN1bHQgb2YgZ2FjaGFfcmVzdWx0cykge1xuICAgICAgICBjb25zdCBpdGVtID0gc2hvcF9pdGVtcy5nZXQoZ2FjaGFfcmVzdWx0LmlkKTtcbiAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCB0byBmaW5kIGl0ZW0gJHtnYWNoYV9yZXN1bHQuaWR9IGZyb20gXCIke25hbWV9XCIgaW4gc2hvcGApO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaXRlbS5zb3VyY2VzLnB1c2gobmV3IEl0ZW1Tb3VyY2UobmFtZSwgMCwgZmFsc2UsIHRvdGFsX3Byb2JhYmlsaXR5IC8gZ2FjaGFfcmVzdWx0LmNoYW5jZSkpO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZG93bmxvYWQodXJsOiBzdHJpbmcsIHZhbHVlOiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsIG1heF92YWx1ZTogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgZmlsZW5hbWUgPSB1cmwuc2xpY2UodXJsLmxhc3RJbmRleE9mKFwiL1wiKSArIDEpO1xuICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvYWRpbmdcIik7XG4gICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gYExvYWRpbmcgJHtmaWxlbmFtZX0sIHBsZWFzZSB3YWl0Li4uYDtcbiAgICB9XG4gICAgY29uc3QgcHJvZ3Jlc3NiYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInByb2dyZXNzYmFyXCIpO1xuICAgIGlmIChwcm9ncmVzc2JhciBpbnN0YW5jZW9mIEhUTUxQcm9ncmVzc0VsZW1lbnQpIHtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICBwcm9ncmVzc2Jhci52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXhfdmFsdWUpIHtcbiAgICAgICAgICAgIHByb2dyZXNzYmFyLm1heCA9IG1heF92YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zdCByZXBseSA9IGF3YWl0IGZldGNoKHVybCk7XG4gICAgaWYgKCFyZXBseS5vaykge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIHJlcGx5LnRleHQoKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkSXRlbXMoKSB7XG4gICAgY29uc3QgaXRlbVNvdXJjZSA9IFwiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3NzdG9raWMtdGdtL0pGVFNFL2RldmVsb3BtZW50L2F1dGgtc2VydmVyL3NyYy9tYWluL3Jlc291cmNlcy9yZXNcIjtcbiAgICBjb25zdCBnYWNoYVNvdXJjZSA9IFwiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3NzdG9raWMtdGdtL0pGVFNFL2RldmVsb3BtZW50L2VtdWxhdG9yL3NyYy9tYWluL3Jlc291cmNlcy9yZXMvbG90dGVyeVwiO1xuICAgIGxldCBkb3dubG9hZENvdW50ZXIgPSAxO1xuICAgIGNvbnN0IGl0ZW1VUkwgPSBpdGVtU291cmNlICsgXCIvSXRlbV9QYXJ0c19JbmkzLnhtbFwiO1xuICAgIGNvbnN0IGl0ZW1EYXRhID0gYXdhaXQgZG93bmxvYWQoaXRlbVVSTCwgZG93bmxvYWRDb3VudGVyKyspO1xuICAgIGNvbnN0IHNob3BVUkwgPSBpdGVtU291cmNlICsgXCIvU2hvcF9JbmkzLnhtbFwiO1xuICAgIGNvbnN0IHNob3BEYXRhID0gYXdhaXQgZG93bmxvYWQoc2hvcFVSTCwgZG93bmxvYWRDb3VudGVyKyspO1xuICAgIHBhcnNlSXRlbURhdGEoaXRlbURhdGEpO1xuICAgIHBhcnNlU2hvcERhdGEoc2hvcERhdGEpO1xuICAgIGNvbnNvbGUubG9nKGBGb3VuZCAke2dhY2hhcy5sZW5ndGh9IGdhY2hhc2ApO1xuICAgIGZvciAoY29uc3QgZ2FjaGEgb2YgZ2FjaGFzKSB7XG4gICAgICAgIGNvbnN0IGdhY2hhX3VybCA9IGAke2dhY2hhU291cmNlfS9JbmkzX0xvdF8ke2Ake2dhY2hhLmlkfWAucGFkU3RhcnQoMiwgXCIwXCIpfS54bWxgO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcGFyc2VHYWNoYURhdGEoYXdhaXQgZG93bmxvYWQoZ2FjaGFfdXJsLCBkb3dubG9hZENvdW50ZXIrKywgZ2FjaGFzLmxlbmd0aCArIDIpLCBnYWNoYS5uYW1lKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBGYWlsZWQgZG93bmxvYWRpbmcgJHtnYWNoYV91cmx9IGJlY2F1c2UgJHtlfWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKGBMb2FkZWQgJHtpdGVtcy5zaXplfSBpdGVtc2ApO1xufVxuXG5mdW5jdGlvbiBpdGVtVG9UYWJsZVJvdyhpdGVtOiBJdGVtLCBzb3VyY2VGaWx0ZXI6IChpdGVtU291cmNlOiBJdGVtU291cmNlKSA9PiBib29sZWFuKTogSFRNTFRhYmxlUm93RWxlbWVudCB7XG4gICAgLy9OYW1lXG4gICAgLy9DaGFyYWN0ZXJcbiAgICAvL1BhcnRcbiAgICAvL1N0clxuICAgIC8vU3RhXG4gICAgLy9EZXhcbiAgICAvL1dpbFxuICAgIC8vU21hc2hcbiAgICAvL01vdmVtZW50XG4gICAgLy9DaGFyZ2VcbiAgICAvL0xvYlxuICAgIC8vU2VydmVcbiAgICAvL01heCBsZXZlbFxuXG4gICAgY29uc3QgbmFtZVN0cmluZyA9IChpdGVtOiBJdGVtKSA9PiB7XG4gICAgICAgIGlmIChpdGVtLm5hbWVfc2hvcCAhPT0gaXRlbS5uYW1lX2VuKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS5uYW1lX2VuICsgXCIvXCIgKyBpdGVtLm5hbWVfc2hvcDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXRlbS5uYW1lX2VuO1xuICAgIH1cblxuICAgIGNvbnN0IHJvdyA9IGNyZWF0ZUhUTUwoXG4gICAgICAgIFtcInRyXCIsXG4gICAgICAgICAgICBbXCJ0ZFwiLCBpdGVtLm5hbWVfZW5dLFxuICAgICAgICAgICAgW1widGRcIiwgYCR7aXRlbS5pZH1gXSxcbiAgICAgICAgICAgIFtcInRkXCIsIGl0ZW0uY2hhcmFjdGVyXSxcbiAgICAgICAgICAgIFtcInRkXCIsIGl0ZW0ucGFydF0sXG4gICAgICAgICAgICBbXCJ0ZFwiLCBgJHtpdGVtLnN0cn1gXSxcbiAgICAgICAgICAgIFtcInRkXCIsIGAke2l0ZW0uc3RhfWBdLFxuICAgICAgICAgICAgW1widGRcIiwgYCR7aXRlbS5kZXh9YF0sXG4gICAgICAgICAgICBbXCJ0ZFwiLCBgJHtpdGVtLndpbH1gXSxcbiAgICAgICAgICAgIFtcInRkXCIsIGAke2l0ZW0uc21hc2h9YF0sXG4gICAgICAgICAgICBbXCJ0ZFwiLCBgJHtpdGVtLm1vdmVtZW50fWBdLFxuICAgICAgICAgICAgW1widGRcIiwgYCR7aXRlbS5jaGFyZ2V9YF0sXG4gICAgICAgICAgICBbXCJ0ZFwiLCBgJHtpdGVtLmxvYn1gXSxcbiAgICAgICAgICAgIFtcInRkXCIsIGAke2l0ZW0uc2VydmV9YF0sXG4gICAgICAgICAgICBbXCJ0ZFwiLCBgJHtpdGVtLmhwfWBdLFxuICAgICAgICAgICAgW1widGRcIiwgYCR7aXRlbS5sZXZlbH1gXSxcbiAgICAgICAgICAgIFtcInRkXCIsIGl0ZW0uc291cmNlcy5maWx0ZXIoc291cmNlRmlsdGVyKS5tYXAoaXRlbSA9PiBpdGVtLmRpc3BsYXlfc3RyaW5nKCkpLmpvaW4oXCIsIFwiKSxcbiAgICAgICAgICAgIF1cbiAgICAgICAgXVxuICAgICk7XG4gICAgcmV0dXJuIHJvdztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlc3VsdHNUYWJsZShmaWx0ZXI6IChpdGVtOiBJdGVtKSA9PiBib29sZWFuLCBzb3VyY2VGaWx0ZXI6IChpdGVtU291cmNlOiBJdGVtU291cmNlKSA9PiBib29sZWFuLCBwcmlvcml6ZXI6IChpdGVtczogSXRlbVtdLCBpdGVtOiBJdGVtKSA9PiBJdGVtW10pOiBIVE1MVGFibGVFbGVtZW50IHtcbiAgICBjb25zdCByZXN1bHRzOiB7IFtrZXk6IHN0cmluZ106IEl0ZW1bXSB9ID0ge1xuICAgICAgICBcIkhhdFwiOiBbXSxcbiAgICAgICAgXCJIYWlyXCI6IFtdLFxuICAgICAgICBcIkR5ZVwiOiBbXSxcbiAgICAgICAgXCJVcHBlclwiOiBbXSxcbiAgICAgICAgXCJMb3dlclwiOiBbXSxcbiAgICAgICAgXCJTaG9lc1wiOiBbXSxcbiAgICAgICAgXCJTb2Nrc1wiOiBbXSxcbiAgICAgICAgXCJIYW5kXCI6IFtdLFxuICAgICAgICBcIkJhY2twYWNrXCI6IFtdLFxuICAgICAgICBcIkZhY2VcIjogW10sXG4gICAgICAgIFwiUmFja2V0XCI6IFtdLFxuICAgIH07XG5cbiAgICBmb3IgKGNvbnN0IFssIGl0ZW1dIG9mIGl0ZW1zKSB7XG4gICAgICAgIGlmIChmaWx0ZXIoaXRlbSkpIHtcbiAgICAgICAgICAgIHJlc3VsdHNbaXRlbS5wYXJ0XSA9IHByaW9yaXplcihyZXN1bHRzW2l0ZW0ucGFydF0sIGl0ZW0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdGFibGUgPSBjcmVhdGVIVE1MKFxuICAgICAgICBbXCJ0YWJsZVwiLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1wiY29sXCJdLFxuICAgICAgICAgICAgW1widHJcIixcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCBcIk5hbWVcIl0sXG4gICAgICAgICAgICAgICAgW1widGhcIiwgXCJJRFwiXSxcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCBcIkNoYXJhY3RlclwiXSxcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCBcIlBhcnRcIl0sXG4gICAgICAgICAgICAgICAgW1widGhcIiwgXCJTdHJcIl0sXG4gICAgICAgICAgICAgICAgW1widGhcIiwgXCJTdGFcIl0sXG4gICAgICAgICAgICAgICAgW1widGhcIiwgXCJEZXhcIl0sXG4gICAgICAgICAgICAgICAgW1widGhcIiwgXCJXaWxcIl0sXG4gICAgICAgICAgICAgICAgW1widGhcIiwgXCJTbWFzaFwiXSxcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCBcIk1vdmVtZW50XCJdLFxuICAgICAgICAgICAgICAgIFtcInRoXCIsIFwiQ2hhcmdlXCJdLFxuICAgICAgICAgICAgICAgIFtcInRoXCIsIFwiTG9iXCJdLFxuICAgICAgICAgICAgICAgIFtcInRoXCIsIFwiU2VydmVcIl0sXG4gICAgICAgICAgICAgICAgW1widGhcIiwgXCJIUFwiXSxcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCBcIkxldmVsXCJdLFxuICAgICAgICAgICAgICAgIFtcInRoXCIsIFwiU291cmNlXCJdLFxuICAgICAgICAgICAgXVxuICAgICAgICBdXG4gICAgKTtcbiAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiBPYmplY3QudmFsdWVzKHJlc3VsdHMpKSB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiByZXN1bHQpIHtcbiAgICAgICAgICAgIHRhYmxlLmFwcGVuZENoaWxkKGl0ZW1Ub1RhYmxlUm93KGl0ZW0sIHNvdXJjZUZpbHRlcikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YWJsZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1heEl0ZW1MZXZlbCgpIHtcbiAgICAvL25vIHJlZHVjZSBmb3IgTWFwP1xuICAgIGxldCBtYXggPSAwO1xuICAgIGZvciAoY29uc3QgWywgaXRlbV0gb2YgaXRlbXMpIHtcbiAgICAgICAgbWF4ID0gTWF0aC5tYXgobWF4LCBpdGVtLmxldmVsKTtcbiAgICB9XG4gICAgcmV0dXJuIG1heDtcbn0iLCJpbXBvcnQgeyBtYWtlQ2hlY2tib3hUcmVlLCBUcmVlTm9kZSwgZ2V0TGVhZlN0YXRlcyB9IGZyb20gJy4vY2hlY2tib3hUcmVlJztcbmltcG9ydCB7IGRvd25sb2FkSXRlbXMsIGdldFJlc3VsdHNUYWJsZSwgSXRlbSwgSXRlbVNvdXJjZSwgZ2V0TWF4SXRlbUxldmVsIH0gZnJvbSAnLi9pdGVtTG9va3VwJztcbmltcG9ydCB7IGNyZWF0ZUhUTUwgfSBmcm9tICcuL2h0bWwnO1xuXG5jb25zdCBjaGFyYWN0ZXJzID0gW1wiQWxsXCIsIFwiTmlraVwiLCBcIkx1bkx1blwiLCBcIkx1Y3lcIiwgXCJTaHVhXCIsIFwiRGhhbnBpclwiLCBcIlBvY2hpXCIsIFwiQWxcIixdO1xuXG5jb25zdCBwYXJ0c0ZpbHRlciA9IFtcbiAgICBcIlBhcnRzXCIsIFtcbiAgICAgICAgXCJIZWFkXCIsIFtcbiAgICAgICAgICAgIFwiSGF0XCIsXG4gICAgICAgICAgICBcIkhhaXJcIixcbiAgICAgICAgICAgIFwiRHllXCIsXG4gICAgICAgIF0sXG4gICAgICAgIFwiVXBwZXJcIixcbiAgICAgICAgXCJMb3dlclwiLFxuICAgICAgICBcIkxlZ3NcIiwgW1xuICAgICAgICAgICAgXCJTaG9lc1wiLFxuICAgICAgICAgICAgXCJTb2Nrc1wiLFxuICAgICAgICBdLFxuICAgICAgICBcIkF1eFwiLCBbXG4gICAgICAgICAgICBcIkhhbmRcIixcbiAgICAgICAgICAgIFwiQmFja3BhY2tcIixcbiAgICAgICAgICAgIFwiRmFjZVwiXG4gICAgICAgIF0sXG4gICAgICAgIFwiUmFja2V0XCIsXG4gICAgXSxcbl07XG5cbmNvbnN0IGF2YWlsYWJpbGl0eUZpbHRlciA9IFtcbiAgICBcIkF2YWlsYWJpbGl0eVwiLCBbXG4gICAgICAgIFwiU2hvcFwiLCBbXG4gICAgICAgICAgICBcIkdvbGRcIixcbiAgICAgICAgICAgIFwiQVBcIixcbiAgICAgICAgXSxcbiAgICAgICAgXCJBbGxvdyBnYWNoYVwiLFxuICAgICAgICBcIi1HdWFyZGlhblwiLFxuICAgICAgICBcIlBhcmNlbCBlbmFibGVkXCIsXG4gICAgICAgIFwiUGFyY2VsIGRpc2FibGVkXCIsXG4gICAgICAgIFwiRXhjbHVkZSB1bmF2YWlsYWJsZSBpdGVtc1wiLFxuICAgICAgICBcIkV4Y2x1ZGUgc3RhdGxlc3MgaXRlbXNcIixcbiAgICBdLFxuXTtcblxuZnVuY3Rpb24gZ2V0TmFtZShub2RlOiBIVE1MSW5wdXRFbGVtZW50KTogc3RyaW5nIHwgbnVsbCB8IHZvaWQge1xuICAgIGNvbnN0IHBhcmVudCA9IG5vZGUucGFyZW50RWxlbWVudDtcbiAgICBpZiAoIShwYXJlbnQgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSkge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBwYXJlbnQuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hpbGQudGV4dENvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoaWxkID09PSBub2RlKSB7XG4gICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFkZEZpbHRlclRyZWVzKCkge1xuICAgIGNvbnN0IHRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2hhcmFjdGVyRmlsdGVyc1wiKTtcbiAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGZpcnN0ID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IGNoYXJhY3RlciBvZiBjaGFyYWN0ZXJzKSB7XG4gICAgICAgIGNvbnN0IGlkID0gYGNoYXJhY3RlclNlbGVjdG9yc18ke2NoYXJhY3Rlcn1gO1xuICAgICAgICBjb25zdCByYWRpb19idXR0b24gPSBjcmVhdGVIVE1MKFtcImlucHV0XCIsIHsgaWQ6IGlkLCB0eXBlOiBcInJhZGlvXCIsIG5hbWU6IFwiY2hhcmFjdGVyU2VsZWN0b3JzXCIsIHZhbHVlOiBjaGFyYWN0ZXIgfV0pO1xuICAgICAgICByYWRpb19idXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIHVwZGF0ZVJlc3VsdHMpO1xuICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQocmFkaW9fYnV0dG9uKTtcbiAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKGNyZWF0ZUhUTUwoW1wibGFiZWxcIiwgeyBmb3I6IGlkIH0sIGNoYXJhY3Rlcl0pKTtcbiAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKGNyZWF0ZUhUTUwoW1wiYnJcIl0pKTtcbiAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgICByYWRpb19idXR0b24uY2hlY2tlZCA9IHRydWU7XG4gICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZmlsdGVyczogW1RyZWVOb2RlLCBzdHJpbmddW10gPSBbXG4gICAgICAgIFtwYXJ0c0ZpbHRlciwgXCJwYXJ0c0ZpbHRlclwiXSxcbiAgICAgICAgW2F2YWlsYWJpbGl0eUZpbHRlciwgXCJhdmFpbGFiaWxpdHlGaWx0ZXJcIl0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IFtmaWx0ZXIsIG5hbWVdIG9mIGZpbHRlcnMpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobmFtZSk7XG4gICAgICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdHJlZSA9IG1ha2VDaGVja2JveFRyZWUoZmlsdGVyKTtcbiAgICAgICAgdHJlZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHVwZGF0ZVJlc3VsdHMpO1xuICAgICAgICB0YXJnZXQuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKHRyZWUpO1xuICAgIH1cbn1cblxuYWRkRmlsdGVyVHJlZXMoKTtcblxubGV0IGRyYWdnZWQ6IEhUTUxFbGVtZW50O1xuXG5mdW5jdGlvbiBhcHBseURyYWdEcm9wKCkge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgKHsgdGFyZ2V0IH0pID0+IHtcbiAgICAgICAgaWYgKCEodGFyZ2V0IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZHJhZ2dlZCA9IHRhcmdldDtcbiAgICB9KTtcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9KTtcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsICh7IHRhcmdldCB9KSA9PiB7XG4gICAgICAgIGlmICghKHRhcmdldCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0YXJnZXQuY2xhc3NOYW1lID09IFwiZHJvcHpvbmVcIiAmJiB0YXJnZXQgIT09IGRyYWdnZWQpIHtcbiAgICAgICAgICAgIGlmIChkcmFnZ2VkLnBhcmVudE5vZGUgIT09IHRhcmdldC5wYXJlbnROb2RlKSB7IC8vZGlzYWxsb3cgZHJhZ2dpbmcgYWNyb3NzIGRpZmZlcmVudCBsaXN0c1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGxpc3QgPSBBcnJheS5mcm9tKGRyYWdnZWQucGFyZW50Tm9kZT8uY2hpbGRyZW4gPz8gbmV3IEhUTUxDb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKGRyYWdnZWQpO1xuICAgICAgICAgICAgZHJhZ2dlZC5yZW1vdmUoKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA+IGxpc3QuaW5kZXhPZih0YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0LmJlZm9yZShkcmFnZ2VkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0LmFmdGVyKGRyYWdnZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdXBkYXRlUmVzdWx0cygpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmFwcGx5RHJhZ0Ryb3AoKTtcblxuZnVuY3Rpb24gY29tcGFyZShsaHM6IG51bWJlciwgcmhzOiBudW1iZXIpIHtcbiAgICBpZiAobGhzID09IHJocykge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIGxocyA8IHJocyA/IC0xIDogMTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlUmVzdWx0cygpIHtcbiAgICBjb25zdCBmaWx0ZXJzOiAoKGl0ZW06IEl0ZW0pID0+IGJvb2xlYW4pW10gPSBbXTtcbiAgICBjb25zdCBzb3VyY2VGaWx0ZXJzOiAoKGl0ZW1Tb3VyY2U6IEl0ZW1Tb3VyY2UpID0+IGJvb2xlYW4pW10gPSBbXTtcblxuICAgIHsgLy9jaGFyYWN0ZXIgZmlsdGVyXG4gICAgICAgIGNvbnN0IGNoYXJhY3RlckZpbHRlckxpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZShcImNoYXJhY3RlclNlbGVjdG9yc1wiKTtcbiAgICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGNoYXJhY3RlckZpbHRlckxpc3QpIHtcbiAgICAgICAgICAgIGlmICghKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSkge1xuICAgICAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50LmNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzZWxlY3RlZF9jaGFyYWN0ZXIgPSBlbGVtZW50LnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZF9jaGFyYWN0ZXIgIT09IFwiQWxsXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVycy5wdXNoKGl0ZW0gPT4gaXRlbS5jaGFyYWN0ZXIgPT09IHNlbGVjdGVkX2NoYXJhY3Rlcik7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHsgLy9wYXJ0cyBmaWx0ZXJcbiAgICAgICAgY29uc3QgcGFydHNGaWx0ZXJMaXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXJ0c0ZpbHRlclwiKT8uY2hpbGRyZW5bMF07XG4gICAgICAgIGlmICghKHBhcnRzRmlsdGVyTGlzdCBpbnN0YW5jZW9mIEhUTUxVTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFydHNTdGF0ZXMgPSBnZXRMZWFmU3RhdGVzKHBhcnRzRmlsdGVyTGlzdCk7XG4gICAgICAgIGZpbHRlcnMucHVzaCgoaXRlbTogSXRlbSk6IGJvb2xlYW4gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnRzU3RhdGVzW2l0ZW0ucGFydF07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHsgLy9hdmFpbGFiaWxpdHkgZmlsdGVyXG4gICAgICAgIGNvbnN0IGF2YWlsYWJpbGl0eUZpbHRlckxpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImF2YWlsYWJpbGl0eUZpbHRlclwiKT8uY2hpbGRyZW5bMF07XG4gICAgICAgIGlmICghKGF2YWlsYWJpbGl0eUZpbHRlckxpc3QgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGF2YWlsYWJpbGl0eVN0YXRlcyA9IGdldExlYWZTdGF0ZXMoYXZhaWxhYmlsaXR5RmlsdGVyTGlzdCk7XG4gICAgICAgIGlmICghYXZhaWxhYmlsaXR5U3RhdGVzW1wiR29sZFwiXSkge1xuICAgICAgICAgICAgc291cmNlRmlsdGVycy5wdXNoKGl0ZW1Tb3VyY2UgPT4gIWl0ZW1Tb3VyY2UuaXNfZ29sZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhdmFpbGFiaWxpdHlTdGF0ZXNbXCJBUFwiXSkge1xuICAgICAgICAgICAgc291cmNlRmlsdGVycy5wdXNoKGl0ZW1Tb3VyY2UgPT4gIWl0ZW1Tb3VyY2UuaXNfYXApO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYXZhaWxhYmlsaXR5U3RhdGVzW1wiUGFyY2VsIGVuYWJsZWRcIl0pIHtcbiAgICAgICAgICAgIGZpbHRlcnMucHVzaChpdGVtID0+ICFpdGVtLnBhcmNlbF9lbmFibGVkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWF2YWlsYWJpbGl0eVN0YXRlc1tcIlBhcmNlbCBkaXNhYmxlZFwiXSkge1xuICAgICAgICAgICAgZmlsdGVycy5wdXNoKGl0ZW0gPT4gaXRlbS5wYXJjZWxfZW5hYmxlZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhdmFpbGFiaWxpdHlTdGF0ZXNbXCJBbGxvdyBnYWNoYVwiXSkge1xuICAgICAgICAgICAgc291cmNlRmlsdGVycy5wdXNoKGl0ZW1Tb3VyY2UgPT4gIWl0ZW1Tb3VyY2UuaXNfZ2FjaGEpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhdmFpbGFiaWxpdHlTdGF0ZXNbXCJFeGNsdWRlIHN0YXRsZXNzIGl0ZW1zXCJdKSB7XG4gICAgICAgICAgICBmaWx0ZXJzLnB1c2goaXRlbSA9PiAhIWl0ZW0uYnVmZnNsb3RzIHx8ICEhaXRlbS5jaGFyZ2UgfHwgISFpdGVtLmRleCB8fCAhIWl0ZW0uaHAgfHwgISFpdGVtLmxvYiB8fCAhIWl0ZW0ubW92ZW1lbnQgfHwgISFpdGVtLnF1aWNrc2xvdHMgfHwgISFpdGVtLnNlcnZlIHx8ICEhaXRlbS5zbWFzaCB8fCAhIWl0ZW0uc3RhIHx8ICEhaXRlbS5zdHIgfHwgISFpdGVtLndpbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGF2YWlsYWJpbGl0eVN0YXRlc1tcIkV4Y2x1ZGUgdW5hdmFpbGFibGUgaXRlbXNcIl0pIHtcbiAgICAgICAgICAgIGZpbHRlcnMucHVzaChpdGVtID0+IGl0ZW0uc291cmNlcy5maWx0ZXIoc291cmNlID0+IHNvdXJjZUZpbHRlcnMuZXZlcnkoc291cmNlRmlsdGVyID0+IHNvdXJjZUZpbHRlcihzb3VyY2UpKSkubGVuZ3RoID4gMCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB7IC8vbWlzYyBmaWx0ZXJcbiAgICAgICAgY29uc3QgbGV2ZWxyYW5nZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGV2ZWxyYW5nZVwiKTtcbiAgICAgICAgaWYgKCEobGV2ZWxyYW5nZSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbWF4TGV2ZWwgPSBwYXJzZUludChsZXZlbHJhbmdlLnZhbHVlKTtcbiAgICAgICAgZmlsdGVycy5wdXNoKChpdGVtOiBJdGVtKSA9PiBpdGVtLmxldmVsIDw9IG1heExldmVsKTtcblxuICAgICAgICBjb25zdCBuYW1lZmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYW1lRmlsdGVyXCIpO1xuICAgICAgICBpZiAoIShuYW1lZmlsdGVyIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpdGVtX25hbWUgPSBuYW1lZmlsdGVyLnZhbHVlO1xuICAgICAgICBpZiAoaXRlbV9uYW1lKSB7XG4gICAgICAgICAgICBmaWx0ZXJzLnB1c2goaXRlbSA9PiBpdGVtLm5hbWVfZW4udG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhpdGVtX25hbWUudG9Mb3dlckNhc2UoKSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY29tcGFyYXRvcnM6ICgobGhzOiBJdGVtLCByaHM6IEl0ZW0pID0+IG51bWJlcilbXSA9IFtdO1xuXG4gICAge1xuICAgICAgICBjb25zdCBwcmlvcml0eUxpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInByaW9yaXR5IGxpc3RcIik7XG4gICAgICAgIGlmICghKHByaW9yaXR5TGlzdCBpbnN0YW5jZW9mIEhUTUxPTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dHMgPSBBcnJheS5mcm9tKHByaW9yaXR5TGlzdC5jaGlsZE5vZGVzKS5maWx0ZXIobm9kZSA9PiAhbm9kZS50ZXh0Q29udGVudD8uaW5jbHVkZXMoJ1xcbicpKS5tYXAobm9kZSA9PiBub2RlLnRleHRDb250ZW50KTtcbiAgICAgICAgZm9yIChjb25zdCB0ZXh0IG9mIHRleHRzKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHRleHQpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiTW92ZW1lbnQgU3BlZWRcIjpcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyYXRvcnMucHVzaCgobGhzOiBJdGVtLCByaHM6IEl0ZW0pID0+IGNvbXBhcmUobGhzLm1vdmVtZW50LCByaHMubW92ZW1lbnQpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkNoYXJnZVwiOlxuICAgICAgICAgICAgICAgICAgICBjb21wYXJhdG9ycy5wdXNoKChsaHM6IEl0ZW0sIHJoczogSXRlbSkgPT4gY29tcGFyZShsaHMuY2hhcmdlLCByaHMuY2hhcmdlKSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJMb2JcIjpcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyYXRvcnMucHVzaCgobGhzOiBJdGVtLCByaHM6IEl0ZW0pID0+IGNvbXBhcmUobGhzLmxvYiwgcmhzLmxvYikpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiU3RyXCI6XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmF0b3JzLnB1c2goKGxoczogSXRlbSwgcmhzOiBJdGVtKSA9PiBjb21wYXJlKGxocy5zdHIsIHJocy5zdHIpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkRleFwiOlxuICAgICAgICAgICAgICAgICAgICBjb21wYXJhdG9ycy5wdXNoKChsaHM6IEl0ZW0sIHJoczogSXRlbSkgPT4gY29tcGFyZShsaHMuZGV4LCByaHMuZGV4KSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJTdGFcIjpcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyYXRvcnMucHVzaCgobGhzOiBJdGVtLCByaHM6IEl0ZW0pID0+IGNvbXBhcmUobGhzLnN0YSwgcmhzLnN0YSkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiV2lsbFwiOlxuICAgICAgICAgICAgICAgICAgICBjb21wYXJhdG9ycy5wdXNoKChsaHM6IEl0ZW0sIHJoczogSXRlbSkgPT4gY29tcGFyZShsaHMud2lsLCByaHMud2lsKSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJTZXJ2ZVwiOlxuICAgICAgICAgICAgICAgICAgICBjb21wYXJhdG9ycy5wdXNoKChsaHM6IEl0ZW0sIHJoczogSXRlbSkgPT4gY29tcGFyZShsaHMuc2VydmUsIHJocy5zZXJ2ZSkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiUXVpY2tzbG90c1wiOlxuICAgICAgICAgICAgICAgICAgICBjb21wYXJhdG9ycy5wdXNoKChsaHM6IEl0ZW0sIHJoczogSXRlbSkgPT4gY29tcGFyZShsaHMucXVpY2tzbG90cywgcmhzLnF1aWNrc2xvdHMpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkJ1ZmZzbG90c1wiOlxuICAgICAgICAgICAgICAgICAgICBjb21wYXJhdG9ycy5wdXNoKChsaHM6IEl0ZW0sIHJoczogSXRlbSkgPT4gY29tcGFyZShsaHMuYnVmZnNsb3RzLCByaHMuYnVmZnNsb3RzKSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJIUFwiOlxuICAgICAgICAgICAgICAgICAgICBjb21wYXJhdG9ycy5wdXNoKChsaHM6IEl0ZW0sIHJoczogSXRlbSkgPT4gY29tcGFyZShsaHMuaHAsIHJocy5ocCkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAvL2Nhc2UgXCJBUCBjb3N0XCI6XG4gICAgICAgICAgICAgICAgLy8gICAgY29tcGFyYXRvcnMucHVzaCgobGhzOiBJdGVtLCByaHM6IEl0ZW0pID0+IGNvbXBhcmUobGhzLiAsIHJocy4pKTtcbiAgICAgICAgICAgICAgICAvLyAgICBicmVhaztcbiAgICAgICAgICAgICAgICAvL2Nhc2UgXCJHb2xkIGNvc3RcIjpcbiAgICAgICAgICAgICAgICAvLyAgICBjb21wYXJhdG9ycy5wdXNoKChsaHM6IEl0ZW0sIHJoczogSXRlbSkgPT4gY29tcGFyZShsaHMuICwgcmhzLikpO1xuICAgICAgICAgICAgICAgIC8vICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdGFibGUgPSBnZXRSZXN1bHRzVGFibGUoXG4gICAgICAgIGl0ZW0gPT4gZmlsdGVycy5ldmVyeShmaWx0ZXIgPT4gZmlsdGVyKGl0ZW0pKSxcbiAgICAgICAgaXRlbVNvdXJjZSA9PiBzb3VyY2VGaWx0ZXJzLmV2ZXJ5KGZpbHRlciA9PiBmaWx0ZXIoaXRlbVNvdXJjZSkpLFxuICAgICAgICAoaXRlbXMsIGl0ZW0pID0+IHtcbiAgICAgICAgICAgIGlmIChpdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2l0ZW1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBjb21wYXJhdG9yIG9mIGNvbXBhcmF0b3JzKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChjb21wYXJhdG9yKGl0ZW1zWzBdLCBpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIC0xOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW1zO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBbLi4uaXRlbXMsIGl0ZW1dO1xuICAgICAgICB9XG4gICAgKTtcbiAgICBjb25zdCB0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJlc3VsdHNcIik7XG4gICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0YXJnZXQuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICB0YXJnZXQuYXBwZW5kQ2hpbGQodGFibGUpO1xufVxuXG5mdW5jdGlvbiBzZXRNYXhMZXZlbERpc3BsYXlVcGRhdGUoKSB7XG4gICAgY29uc3QgbGV2ZWxEaXNwbGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsZXZlbERpc3BsYXlcIik7XG4gICAgaWYgKCEobGV2ZWxEaXNwbGF5IGluc3RhbmNlb2YgSFRNTExhYmVsRWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgIH1cbiAgICBjb25zdCBsZXZlbHJhbmdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsZXZlbHJhbmdlXCIpO1xuICAgIGlmICghKGxldmVscmFuZ2UgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgfVxuICAgIGNvbnN0IGNhbGxiYWNrID0gKCkgPT4ge1xuICAgICAgICBsZXZlbERpc3BsYXkudGV4dENvbnRlbnQgPSBgTWF4IGxldmVsIHJlcXVpcmVtZW50OiAke2xldmVscmFuZ2UudmFsdWV9YDtcbiAgICAgICAgdXBkYXRlUmVzdWx0cygpO1xuICAgIH07XG4gICAgbGV2ZWxyYW5nZS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgY2FsbGJhY2spO1xuICAgIGNhbGxiYWNrKCk7XG59XG5cbmZ1bmN0aW9uIHNldERpc3BsYXlVcGRhdGVzKCkge1xuICAgIHNldE1heExldmVsRGlzcGxheVVwZGF0ZSgpO1xuICAgIGNvbnN0IG5hbWVmaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hbWVGaWx0ZXJcIik7XG4gICAgaWYgKCEobmFtZWZpbHRlciBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgfVxuICAgIG5hbWVmaWx0ZXIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIHVwZGF0ZVJlc3VsdHMpO1xufVxuXG5zZXREaXNwbGF5VXBkYXRlcygpO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGF3YWl0IGRvd25sb2FkSXRlbXMoKTtcbiAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInNob3dfYWZ0ZXJfbG9hZFwiKSkge1xuICAgICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICAgICAgICBlbGVtZW50LmhpZGRlbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiaGlkZV9hZnRlcl9sb2FkXCIpKSB7XG4gICAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGxldmVscmFuZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxldmVscmFuZ2VcIik7XG4gICAgaWYgKCEobGV2ZWxyYW5nZSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG4gICAgbGV2ZWxyYW5nZS5tYXggPSBgJHtnZXRNYXhJdGVtTGV2ZWwoKX1gO1xuICAgIGxldmVscmFuZ2UudmFsdWUgPSBsZXZlbHJhbmdlLm1heDtcbiAgICBsZXZlbHJhbmdlLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwiaW5wdXRcIikpO1xuICAgIHVwZGF0ZVJlc3VsdHMoKTtcbn0pOyJdfQ==
