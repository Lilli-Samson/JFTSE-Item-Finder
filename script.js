!function r(n,s,o){function c(t,e){if(!s[t]){if(!n[t]){var a="function"==typeof require&&require;if(!e&&a)return a(t,!0);if(i)return i(t,!0);throw(e=new Error("Cannot find module '"+t+"'")).code="MODULE_NOT_FOUND",e}a=s[t]={exports:{}},n[t][0].call(a.exports,function(e){return c(n[t][1][e]||e)},a,a.exports,r,n,s,o)}return s[t].exports}for(var i="function"==typeof require&&require,e=0;e<o.length;e++)c(o[e]);return c}({1:[function(e,t,a){"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.getLeafStates=function(e){var t={};for(const a of n(e))t[a.id.replaceAll("_"," ")]=a.checked;return t},a.makeCheckboxTree=function(e){e=function t(a){{if("string"==typeof a){let e=!1,t=("-"===a[0]&&(a=a.substring(1),e=!0),!1);"+"===a[0]&&(a=a.substring(1),t=!0);const r=(0,o.createHTML)(["li",["input",{type:"checkbox",id:a.replaceAll(" ","_"),...t&&{checked:"checked"}}],["label",{for:a.replaceAll(" ","_")},a]]);return e&&r.classList.add("disabled"),r}{const n=(0,o.createHTML)(["ul",{class:"checkbox"}]);for(let e=0;e<a.length;e++){const s=a[e];n.appendChild(t(s))}return(0,o.createHTML)(["li",n])}}}(e).children[0];if(!(e instanceof HTMLUListElement))throw"Internal error";!function e(t){for(const a of t.children)a instanceof HTMLLIElement?r(a.children[0]):a instanceof HTMLUListElement&&e(a)}(e);for(const t of n(e))c(t);return e},a.setLeafStates=function(e,t){for(const r of n(e)){var a=t[r.id.replaceAll("_"," ")];void 0!==a&&(r.checked=a,c(r))}};var o=e("./html");function s(e){var t=e.parentElement;if(t instanceof HTMLLIElement){var a=t.parentElement;if(a instanceof HTMLUListElement)for(let e=0;e<a.children.length;e++)if(a.children[e]===t){var r=a.children[e+1]?.children[0];if(r instanceof HTMLUListElement)return Array.from(r.children).filter(e=>e instanceof HTMLLIElement&&e.children[0]instanceof HTMLInputElement).map(e=>e.children[0]);break}}return[]}function c(r){r=function(t){var a=t.parentElement?.parentElement?.parentElement;if(a instanceof HTMLLIElement){t=a.parentElement;if(t instanceof HTMLUListElement){let e;for(const r of t.children)if(r instanceof HTMLLIElement&&r.children[0]instanceof HTMLInputElement)e=r;else if(r===a&&e)return e.children[0]}}}(r);if(r){let e=!1,t=!1,a=!1;for(const n of s(r))n.checked?e=!0:t=!0,n.indeterminate&&(a=!0);a||e&&t?r.indeterminate=!0:e?(r.checked=!0,r.indeterminate=!1):t&&(r.checked=!1,r.indeterminate=!1),c(r)}}function r(e){e.addEventListener("change",e=>{e=e.target;e instanceof HTMLInputElement&&(!function e(t){for(const a of s(t))a.checked!==t.checked&&(a.checked=t.checked,a.indeterminate=!1,e(a))}(e),c(e))})}function n(e){let t=[];for(const r of e.children){var a=r.children[0];a instanceof HTMLInputElement?0===s(a).length&&t.push(a):a instanceof HTMLUListElement&&(t=t.concat(n(a)))}return t}},{"./html":2}],2:[function(e,t,a){"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.createHTML=function a(t){const r=document.createElement(t[0]);function n(e){if("string"==typeof e||e instanceof HTMLElement)r.append(e);else if(Array.isArray(e))r.append(a(e));else for(const t in e)r.setAttribute(t,e[t])}for(let e=1;e<t.length;e++)n(t[e]);return r}},{}],3:[function(e,t,a){"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.characters=a.ItemSource=a.Item=void 0,a.downloadItems=async function(){let e=1;var t=await o("https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/auth-server/src/main/resources/res/Item_Parts_Ini3.xml",e++),a=await o("https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/auth-server/src/main/resources/res/Shop_Ini3.xml",e++),r=await o("https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/emulator/src/main/resources/res//GuardianStages.json",e++);(function(e){e.length<1e3&&console.warn(`Items file is only ${e.length} bytes long`);for(var[,t]of e.matchAll(/\<Item (.*)\/\>/g)){var a,r,n=new _;for([,a,r]of t.matchAll(/\s?([^=]*)="([^"]*)"/g))switch(a){case"Index":n.id=parseInt(r);break;case"_Name_":n.name_kr=r;break;case"Name_N":n.name_en=r;break;case"UseType":n.useType=r;break;case"MaxUse":n.maxUse=parseInt(r);break;case"Hide":n.hidden=!!parseInt(r);break;case"Resist":n.resist=r;break;case"Char":switch(r){case"NIKI":n.character="Niki";break;case"LUNLUN":n.character="LunLun";break;case"LUCY":n.character="Lucy";break;case"SHUA":n.character="Shua";break;case"DHANPIR":n.character="Dhanpir";break;case"POCHI":n.character="Pochi";break;case"AL":n.character="Al";break;default:console.warn(`Found unknown character "${r}"`)}break;case"Part":switch(String(r)){case"BAG":n.part="Backpack";break;case"GLASSES":n.part="Face";break;case"HAND":n.part="Hand";break;case"SOCKS":n.part="Socks";break;case"FOOT":n.part="Shoes";break;case"CAP":n.part="Hat";break;case"PANTS":n.part="Lower";break;case"RACKET":n.part="Racket";break;case"BODY":n.part="Upper";break;case"HAIR":n.part="Hair";break;case"DYE":n.part="Dye";break;default:console.warn("Found unknown part "+r)}break;case"Level":n.level=parseInt(r);break;case"STR":n.str=parseInt(r);break;case"STA":n.sta=parseInt(r);break;case"DEX":n.dex=parseInt(r);break;case"WIL":n.wil=parseInt(r);break;case"AddHP":n.hp=parseInt(r);break;case"AddQuick":n.quickslots=parseInt(r);break;case"AddBuff":n.buffslots=parseInt(r);break;case"SmashSpeed":n.smash=parseInt(r);break;case"MoveSpeed":n.movement=parseInt(r);break;case"ChargeshotSpeed":n.charge=parseInt(r);break;case"LobSpeed":n.lob=parseInt(r);break;case"ServeSpeed":n.serve=parseInt(r);break;case"MAX_STR":n.max_str=parseInt(r);break;case"MAX_STA":n.max_sta=parseInt(r);break;case"MAX_DEX":n.max_dex=parseInt(r);break;case"MAX_WIL":n.max_wil=parseInt(r);break;case"EnchantElement":n.element_enchantable=!!parseInt(r);break;case"EnableParcel":n.parcel_enabled=!!parseInt(r);break;case"BallSpin":n.spin=parseInt(r);break;case"ATSS":n.atss=parseInt(r);break;case"DFSS":n.dfss=parseInt(r);break;case"Socket":n.socket=parseInt(r);break;case"Gauge":n.gauge=parseInt(r);break;case"GaugeBattle":n.gauge_battle=parseInt(r);break;default:console.warn(`Found unknown item attribute "${a}"`)}L.set(n.id,n)}})(t),function(e){e.length<1e3&&console.warn(`Shop file is only ${e.length} bytes long`);let t=0,a=0;for(const d of e.matchAll(/<Product DISPLAY="\d+" HIT_DISPLAY="\d+" Index="(?<index>\d+)" Enable="(?<enabled>0|1)" New="\d+" Hit="\d+" Free="\d+" Sale="\d+" Event="\d+" Couple="\d+" Nobuy="\d+" Rand="[^"]+" UseType="[^"]+" Use0="\d+" Use1="\d+" Use2="\d+" PriceType="(?<price_type>(?:MINT)|(?:GOLD))" OldPrice0="-?\d+" OldPrice1="-?\d+" OldPrice2="-?\d+" Price0="(?<price>-?\d+)" Price1="-?\d+" Price2="-?\d+" CouplePrice="-?\d+" Category="(?<category>[^"]*)" Name="(?<name>[^"]*)" GoldBack="-?\d+" EnableParcel="(?<parcel_from_shop>0|1)" Char="-?\d+" Item0="(?<item0>-?\d+)" Item1="(?<item1>-?\d+)" Item2="(?<item2>-?\d+)" Item3="(?<item3>-?\d+)" Item4="(?<item4>-?\d+)" Item5="(?<item5>-?\d+)" Item6="(?<item6>-?\d+)" Item7="(?<item7>-?\d+)" Item8="(?<item8>-?\d+)" Item9="(?<item9>-?\d+)" ?(?:Icon="[^"]*" ?)?(?:Name_kr="[^"]*" ?)?(?:Name_en="(?<name_en>[^"]*)" ?)?(?:Name_th="[^"]*" ?)?\/>/g))if(d.groups){var r=parseInt(d.groups.index),n=(a,a=r,d.groups.name),s=d.groups.category,n=("LOTTERY"===s&&k.set(r,new b(r,parseInt(d.groups.item0),n)),!!parseInt(d.groups.enabled)),o="MINT"===d.groups.price_type?"ap":"GOLD"===d.groups.price_type?"gold":"none",c=parseInt(d.groups.price),i=(parseInt(d.groups.parcel_from_shop),[parseInt(d.groups.item0),parseInt(d.groups.item1),parseInt(d.groups.item2),parseInt(d.groups.item3),parseInt(d.groups.item4),parseInt(d.groups.item5),parseInt(d.groups.item6),parseInt(d.groups.item7),parseInt(d.groups.item8),parseInt(d.groups.item9)].filter(e=>!!e&&L.get(e)).map(e=>L.get(e)));if("PARTS"===s){var l=v.forShop(r,c,"ap"==o);if(1===i.length)I.set(r,i[0]),n&&i[0].sources.push(l);else{var u=new _,m=(u.name_en=d.groups.name_en||d.groups.name,I.set(r,u),n&&u.sources.push(l),v.forSet(r,i));for(const h of i)h.sources.push(m)}}else"LOTTERY"===s?((u=new _).name_en=d.groups.name_en||d.groups.name,I.set(r,u),n&&u.sources.push(v.forShop(r,c,"ap"==o))):((l=new _).name_en=d.groups.name_en||d.groups.name,I.set(r,l));t++}console.log(`Found ${t} shop items`)}(a),function(e){e=JSON.parse(e);if(Array.isArray(e))for(const n of e)if("object"==typeof n){var t=n.Name;if("string"==typeof t){var a,r=n.Rewards;if(Array.isArray(r))for(const s of r)"number"==typeof s&&(a=I.get(s))&&a.sources.push(v.forGuardian(t))}}}(r),console.log(`Found ${k.size} gachas`);for(var[,n]of k){var s=`https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/game-server/src/main/resources/res/lottery/Ini3_Lot_${(""+n.gacha_index).padStart(2,"0")}.xml`;try{!function(e,t){for(const o of e.split("\n"))if(o.includes("<LotteryItem_")){var a,r=o.match(/\s*<LotteryItem_(?<character>[^ ]*) Index="\d+" _Name_="[^"]*" ShopIndex="(?<shop_id>\d+)" QuantityMin="\d+" QuantityMax="\d+" ChansPer="(?<probability>\d+\.?\d*)\s*" Effect="\d+" ProductOpt="\d+"\/>/);if(r){if(r.groups){let e=r.groups.character;g(e="Lunlun"===e?"LunLun":e)?(a=I.get(parseInt(r.groups.shop_id)))?t.add(a,parseFloat(r.groups.probability),e):console.warn(`Found unknown shop item id ${r.groups.shop_id} in lottery file `+t.gacha_index):console.warn(`Found unknown character "${e}" in lottery file `+t.gacha_index)}}else console.warn(`Failed parsing gacha ${t.gacha_index}:
`+o)}for(var[,n]of t.shop_items)for(var[s]of n)s.sources.push(v.forGacha(t.shop_index))}(await o(s,e++,k.size+3),n)}catch(e){console.warn(`Failed downloading ${s} because `+e)}}console.log(`Loaded ${L.size} items`)},a.getMaxItemLevel=function(){let e=0;for(var[,t]of L)e=Math.max(e,t.level);return e},a.getResultsTable=function(e,t,a,r){var n={Hat:[],Hair:[],Dye:[],Upper:[],Lower:[],Shoes:[],Socks:[],Hand:[],Backpack:[],Face:[],Racket:[]};for(var[,s]of L)e(s)&&(n[s.part]=a(n[s.part],s));var o=(0,p.createHTML)(["table",["tr",["th",{class:"Name_column"},"Name"],["th",{class:"ID_column numeric"},"ID"],["th",{class:"Character_column"},"Character"],["th",{class:"Part_column"},"Part"],["th",{class:"Str_column numeric"},"Str"],["th",{class:"Sta_column numeric"},"Sta"],["th",{class:"Dex_column numeric"},"Dex"],["th",{class:"Wil_column numeric"},"Wil"],["th",{class:"Smash_column numeric"},"Smash"],["th",{class:"Movement_column numeric"},"Movement"],["th",{class:"Charge_column numeric"},"Charge"],["th",{class:"Lob_column numeric"},"Lob"],["th",{class:"Serve_column numeric"},"Serve"],["th",{class:"HP_column numeric"},"HP"],["th",{class:"Level_column numeric"},"Level"],["th",{class:"Source_column"},"Source"]]]),c={characters:new Set,Str:0,Sta:0,Dex:0,Wil:0,Smash:0,Movement:0,Charge:0,Lob:0,Serve:0,HP:0,Level:0};for(const i of Object.values(n))if(0!==i.length){c.Str+=i[0].str,c.Sta+=i[0].sta,c.Dex+=i[0].dex,c.Wil+=i[0].wil,c.Smash+=i[0].smash,c.Movement+=i[0].movement,c.Charge+=i[0].charge,c.Lob+=i[0].lob,c.Serve+=i[0].serve,c.HP+=i[0].hp,c.Level=Math.max(i[0].level,c.Level);for(const l of i)for(const u of l.character?[l.character]:f)c.characters.add(u),o.appendChild(function(e,t,a){e=(0,p.createHTML)(["tr",["td",{class:"Name_column"},function(e,t){return(0,p.createHTML)(["div",(0,p.createHTML)(["button",{class:"item_removal","data-item_index":""+t},"X"]),e])}(e.name_en,e.id)],["td",{class:"ID_column numeric"},""+e.id],["td",{class:"Character_column"},e.character??"All"],["td",{class:"Part_column"},e.part],["td",{class:"Str_column numeric"},""+e.str],["td",{class:"Sta_column numeric"},""+e.sta],["td",{class:"Dex_column numeric"},""+e.dex],["td",{class:"Wil_column numeric"},""+e.wil],["td",{class:"Smash_column numeric"},""+e.smash],["td",{class:"Movement_column numeric"},""+e.movement],["td",{class:"Charge_column numeric"},""+e.charge],["td",{class:"Lob_column numeric"},""+e.lob],["td",{class:"Serve_column numeric"},""+e.serve],["td",{class:"HP_column numeric"},""+e.hp],["td",{class:"Level_column numeric"},""+e.level],["td",{class:"Source_column"},...E(y(e,t,a))]]);return e}(l,t,g(r)?r:void 0))}if(1===c.characters.size){o.appendChild((0,p.createHTML)(["tr",["td",{class:"total Name_column"},"Total:"],["td",{class:"total ID_column numeric"}],["td",{class:"total Character_column"}],["td",{class:"total Part_column"}],["td",{class:"total Str_column numeric"},""+c.Str],["td",{class:"total Sta_column numeric"},""+c.Sta],["td",{class:"total Dex_column numeric"},""+c.Dex],["td",{class:"total Wil_column numeric"},""+c.Wil],["td",{class:"total Smash_column numeric"},""+c.Smash],["td",{class:"total Movement_column numeric"},""+c.Movement],["td",{class:"total Charge_column numeric"},""+c.Charge],["td",{class:"total Lob_column numeric"},""+c.Lob],["td",{class:"total Serve_column numeric"},""+c.Serve],["td",{class:"total HP_column numeric"},""+c.HP],["td",{class:"total Level_column numeric"},""+c.Level],["td",{class:"total Source_column"}]]));for(const m of o.getElementsByClassName("Character_column"))m instanceof HTMLElement&&(m.hidden=!0)}for(const d of["Str","Sta","Dex","Wil","Smash","Movement","Charge","Lob","Serve","HP"])if(0===c[d])for(const h of o.getElementsByClassName(d+"_column"))h instanceof HTMLElement&&(h.hidden=!0);return o},a.isCharacter=g,a.shop_items=a.items=void 0;var p=e("./html");const f=["Niki","LunLun","Lucy","Shua","Dhanpir","Pochi","Al"];function g(e){return f.includes(e)}a.characters=f;class v{type;shop_id;price;ap;guardian_map;items;constructor(e,t,a,r,n="",s=[]){this.type=e,this.shop_id=t,this.price=a,this.ap=r,this.guardian_map=n,this.items=s}static forShop(e,t,a){return new v("shop",e,t,a)}static forSet(e,t){return new v("set",e,0,!1,"",t)}static forGacha(e){return new v("gacha",e,0,!1)}static forGuardian(e){return new v("guardian",0,0,!1,e)}get requiresAP(){return this.ap&&!!this.price}get requiresGold(){return!this.ap&&!!this.price}get requiresGuardian(){switch(this.type){case"guardian":return!0;case"shop":return!1;case"gacha":case"set":return!this.item.sources.every(e=>e.requiresGuardian)}}get is_parcel_enabled(){return this.item.parcel_enabled}get item(){var e=I.get(this.shop_id);if(e)return e;throw console.error("Failed finding item of itemSource "+this.shop_id),"Internal error"}gachaTries(e,t){var a=k.get(this.shop_id);if(a)return a.average_tries(e,t);throw"Internal error"}}a.ItemSource=v;class _{id=0;name_kr="";name_en="";useType="";maxUse=0;hidden=!1;resist="";character;part="Other";level=0;str=0;sta=0;dex=0;wil=0;hp=0;quickslots=0;buffslots=0;smash=0;movement=0;charge=0;lob=0;serve=0;max_str=0;max_sta=0;max_dex=0;max_wil=0;element_enchantable=!1;parcel_enabled=!1;parcel_from_shop=!1;spin=0;atss=0;dfss=0;socket=0;gauge=0;gauge_battle=0;sources=[]}a.Item=_;class b{shop_index;gacha_index;name;constructor(e,t,a){this.shop_index=e,this.gacha_index=t,this.name=a;for(const r of f)this.shop_items.set(r,new Map)}add(e,t,a){e.character&&e.character!==a&&(a=e.character),this.shop_items.get(a).set(e,t),this.character_probability.set(a,t+(this.character_probability.get(a)||0))}average_tries(a,e=void 0){var e=e?[e]:f,t=e.reduce((e,t)=>e+(this.shop_items.get(t).get(a)||0),0);return 0===t?0:e.reduce((e,t)=>e+this.character_probability.get(t),0)/t}character_probability=new Map;shop_items=new Map}let L=new Map,I=(a.items=L,new Map),k=(a.shop_items=I,new Map),r;function l(e,t){let a=e.toFixed(t);for(;a.endsWith("0");)a=a.slice(0,-1);return a=a.endsWith(".")?a.slice(0,-1):a}async function o(e,t=void 0,a=void 0){var r=e.slice(e.lastIndexOf("/")+1),n=document.getElementById("loading"),n=(n instanceof HTMLElement&&(n.textContent=`Loading ${r}, please wait...`),document.getElementById("progressbar")),r=(n instanceof HTMLProgressElement&&(t&&(n.value=t),a)&&(n.max=a),await fetch(e));return r.ok?r.text():""}function u(e,a){e=(0,p.createHTML)(["a",{class:"popup_link"},e]);return e.addEventListener("click",e=>{var t;e instanceof MouseEvent&&(t=document.getElementById("top_div"))instanceof HTMLDivElement&&(e.stopPropagation(),r&&(r.close(),r.remove()),r=Array.isArray(a)?(0,p.createHTML)(["dialog",...a]):(0,p.createHTML)(["dialog",a]),t.appendChild(r),r.style.position="absolute",r.style.top=e.pageY+"px",r.style.left=e.pageX-300+"px",r.show())}),e}function m(e){var t,a=(0,p.createHTML)(["table",["tr",["th","Number of gachas"],["th","Chance for item"]]]);for(const n of[.1,.5,1,2,5,10]){var r=Math.round(e*n);0!==r&&a.appendChild((0,p.createHTML)(["tr",["td",{class:"numeric"},""+r],["td",{class:"numeric"},(100*(t=1/e,1-Math.pow(1-t,r))).toFixed(4)+"%"]]))}return a.appendChild((0,p.createHTML)(["tr"])),u(""+l(e,2),a)}function y(o,c,i){return o.sources.filter(c).map(e=>{var t=o,a=e,r=c,n=i;switch(a.type){case"gacha":var s=E(y(a.item,r,n));return[function(e,t,a){var r=(0,p.createHTML)(["table",["tr",["th","Item"],["th","Average Tries"]]]),n=k.get(t.shop_id);if(!n)throw"Internal error";for(const c of void 0===a?f:[a]){var s=n.shop_items.get(c);if(s)for(var[o]of s)r.appendChild((0,p.createHTML)(["tr",e===o?{class:"highlighted"}:"",["td",o.name_en],["td",{class:"numeric"},""+l(n.average_tries(o,a),2)]]))}return u(t.item.name_en,[(0,p.createHTML)(["a",n.name]),r])}(t,a,n),(0,p.createHTML)(["a"," x ",m(a.gachaTries(t,n))]),...0<s.length?[" "]:[],...s];case"shop":return[a.price+" "+(a.ap?"AP":"Gold")];case"guardian":return[a.guardian_map];case"set":s=E(y(a.item,r,n));return[function(e,t){var a=(0,p.createHTML)(["table",["tr",["th","Contents"]]]);for(const r of t.items)a.appendChild((0,p.createHTML)(["tr",r===e?{class:"highlighted"}:"",["td",r.name_en]]));return u(t.item.name_en,[(0,p.createHTML)(["a",t.item.name_en,a])])}(t,a),...0<s.length?[" "]:[],...s]}})}function E(e){const t=[];function a(e){"string"==typeof e&&"string"==typeof t[t.length-1]?t[t.length-1]=t[t.length-1]+e:t.push(e)}let r=!0;for(const n of e)if(0===n.length)a(" ");else{r?r=!1:a(", ");for(const s of n)""!==s&&a(s)}return t}document.body.addEventListener("click",e=>{r&&r!==e.target&&(r.close(),r.remove(),r=void 0)})},{"./html":2}],4:[function(e,t,a){"use strict";var L=e("./checkboxTree"),I=e("./itemLookup"),k=e("./html"),y=e("./storage");const i=["Parts",["Head",["+Hat","+Hair","Dye"],"+Upper","+Lower","Legs",["+Shoes","Socks"],"Aux",["+Hand","+Backpack","+Face"],"+Racket"]],l=["Availability",["Shop",["+Gold","+AP"],"+Allow gacha","+Guardian","+Untradable","Unavailable items"]],E=new Set;!function(){const t=document.getElementById("characterFilters");if(t){let e=!0;for(const c of["All",...I.characters]){var a="characterSelectors_"+c,r=(0,k.createHTML)(["input",{id:a,type:"radio",name:"characterSelectors",value:c}]);r.addEventListener("input",u),t.appendChild(r),t.appendChild((0,k.createHTML)(["label",{for:a},c])),t.appendChild((0,k.createHTML)(["br"])),e&&(r.checked=!0,e=!1)}var n,s;for([n,s]of[[i,"partsFilter"],[l,"availabilityFilter"]]){const t=document.getElementById(s);if(!t)return;var o=(0,L.makeCheckboxTree)(n);o.addEventListener("change",u),t.innerText="",t.appendChild(o)}}}();let r;function S(e,t){return e==t?0:e<t?-1:1}function M(){var e;for(const t of document.getElementsByName("characterSelectors")){if(!(t instanceof HTMLInputElement))throw"Internal error";if(t.checked)return e=t.value,(0,I.isCharacter)(e)?e:void 0}}function n(){var e,t,a=y.Variable_storage.get_variable("Character"),r=(!function(e){for(const t of document.getElementsByName("characterSelectors")){if(!(t instanceof HTMLInputElement))throw"Internal error";if(t.value===e)return t.checked=!0}}("string"==typeof a&&(0,I.isCharacter)(a)?a:"All"),{});for([e,t]of Object.entries(y.Variable_storage.variables))"boolean"==typeof t&&(r[e]=t);a=document.getElementById("partsFilter")?.children[0];if(!(a instanceof HTMLUListElement))throw"Internal error";(0,L.setLeafStates)(a,r);a=document.getElementById("availabilityFilter")?.children[0];if(!(a instanceof HTMLUListElement))throw"Internal error";(0,L.setLeafStates)(a,r);a=document.getElementById("levelrange");if(!(a instanceof HTMLInputElement))throw"Internal error";var n=y.Variable_storage.get_variable("maxLevel"),n=(a.value="number"==typeof n?""+n:a.max,document.getElementById("nameFilter"));if(!(n instanceof HTMLInputElement))throw"Internal error";var s=y.Variable_storage.get_variable("nameFilter");"string"==typeof s&&(n.value=s),a.dispatchEvent(new Event("input"))}function u(){var e,t,a,r,n=M()||"All";if(y.Variable_storage.set_variable("Character",n),!((n=document.getElementById("partsFilter")?.children[0])instanceof HTMLUListElement))throw"Internal error";for([e,t]of Object.entries((0,L.getLeafStates)(n)))y.Variable_storage.set_variable(e,t);if(!((n=document.getElementById("availabilityFilter")?.children[0])instanceof HTMLUListElement))throw"Internal error";for([a,r]of Object.entries((0,L.getLeafStates)(n)))y.Variable_storage.set_variable(a,r);if(!((n=document.getElementById("levelrange"))instanceof HTMLInputElement))throw"Internal error";if(n=parseInt(n.value),y.Variable_storage.set_variable("maxLevel",n),!((n=document.getElementById("nameFilter"))instanceof HTMLInputElement))throw"Internal error";(n=n.value)?y.Variable_storage.set_variable("nameFilter",n):y.Variable_storage.delete_variable("nameFilter");const s=[],o=[];let c="";{const c=M();c&&s.push(e=>e.character===c)}{n=document.getElementById("partsFilter")?.children[0];if(!(n instanceof HTMLUListElement))throw"Internal error";const h=(0,L.getLeafStates)(n);s.push(e=>h[e.part])}n=document.getElementById("availabilityFilter")?.children[0];if(!(n instanceof HTMLUListElement))throw"Internal error";n=(0,L.getLeafStates)(n);if(n.Gold||o.push(e=>!e.requiresGold),n.AP||o.push(e=>!e.requiresAP),n.Untradable||s.push(e=>e.parcel_enabled),n["Allow gacha"]||o.push(e=>"gacha"!==e.type),n.Guardian||o.push(e=>!e.requiresGuardian),!n["Unavailable items"]){const p=[...o];function i(e){if(t=e,p.every(e=>e(t))){var t;if("gacha"!==e.type&&"set"!==e.type)return!0;for(const a of e.item.sources)if(i(a))return!0}return!1}o.push(i),s.push(function(e){for(const t of e.sources)if(i(t))return!0;return!1})}{n=document.getElementById("levelrange");if(!(n instanceof HTMLInputElement))throw"Internal error";const f=parseInt(n.value);s.push(e=>e.level<=f);n=document.getElementById("nameFilter");if(!(n instanceof HTMLInputElement))throw"Internal error";const g=n.value;g&&s.push(e=>e.name_en.toLowerCase().includes(g.toLowerCase()))}s.push(e=>!E.has(e.id));var l=document.getElementById("itemFilter");if(!(l instanceof HTMLDivElement))throw"Internal error";for(const v of l.children)v.remove();for(const _ of E){var u=I.items.get(_);u&&l.appendChild((0,k.createHTML)(["div",(0,k.createHTML)(["button",{class:"item_removal_removal","data-item_index":""+_},"X"]),u.name_en]))}const m=[];n=document.getElementById("priority_list");if(!(n instanceof HTMLOListElement))throw"Internal error";for(const b of Array.from(n.childNodes).filter(e=>!e.textContent?.includes("\n")).map(e=>e.textContent))switch(b){case"Movement Speed":m.push((e,t)=>S(e.movement,t.movement));break;case"Charge":m.push((e,t)=>S(e.charge,t.charge));break;case"Lob":m.push((e,t)=>S(e.lob,t.lob));break;case"Str":m.push((e,t)=>S(e.str,t.str));break;case"Dex":m.push((e,t)=>S(e.dex,t.dex));break;case"Sta":m.push((e,t)=>S(e.sta,t.sta));break;case"Will":m.push((e,t)=>S(e.wil,t.wil));break;case"Serve":m.push((e,t)=>S(e.serve,t.serve));break;case"Quickslots":m.push((e,t)=>S(e.quickslots,t.quickslots));break;case"Buffslots":m.push((e,t)=>S(e.buffslots,t.buffslots));break;case"HP":m.push((e,t)=>S(e.hp,t.hp))}var n=(0,I.getResultsTable)(t=>s.every(e=>e(t)),t=>o.every(e=>e(t)),(e,t)=>{if(0===e.length)return[t];for(const a of m)switch(a(e[0],t)){case-1:return[t];case 1:return e}return[...e,t]},c),d=document.getElementById("results");d&&(d.innerText="",d.appendChild(n))}document.addEventListener("dragstart",({target:e})=>{e instanceof HTMLElement&&(r=e)}),document.addEventListener("dragover",e=>{e.preventDefault()}),document.addEventListener("drop",({target:e})=>{var t,a;e instanceof HTMLElement&&"dropzone"==e.className&&e!==r&&r.parentNode===e.parentNode&&(a=(t=Array.from(r.parentNode?.children??new HTMLCollection)).indexOf(r),r.remove(),a>t.indexOf(e)?e.before(r):e.after(r),u())});{const s=document.getElementById("levelDisplay");if(!(s instanceof HTMLLabelElement))throw"Internal error";const o=document.getElementById("levelrange");if(!(o instanceof HTMLInputElement))throw"Internal error";o.addEventListener("input",()=>{s.textContent="Max level requirement: "+o.value,u()})}e=document.getElementById("nameFilter");if(!(e instanceof HTMLElement))throw"Internal error";e.addEventListener("input",u),window.addEventListener("load",async()=>{n(),await(0,I.downloadItems)();for(const a of document.getElementsByClassName("show_after_load"))a instanceof HTMLElement&&(a.hidden=!1);for(const r of document.getElementsByClassName("hide_after_load"))r instanceof HTMLElement&&(r.style.display="none");var e=document.getElementById("levelrange");if(!(e instanceof HTMLInputElement))throw"Internal error";var t=(0,I.getMaxItemLevel)();e.value=""+Math.min(parseInt(e.value),t),e.max=""+t,e.dispatchEvent(new Event("input")),u()}),document.body.addEventListener("click",e=>{e.target instanceof HTMLElement&&("item_removal"===e.target.className?e.target.dataset.item_index&&(E.add(parseInt(e.target.dataset.item_index)),u()):"item_removal_removal"===e.target.className&&e.target.dataset.item_index&&(E.delete(parseInt(e.target.dataset.item_index)),u()))})},{"./checkboxTree":1,"./html":2,"./itemLookup":3,"./storage":5}],5:[function(e,t,a){"use strict";function n(e){var t=e[0],a=e.substring(1);switch(t){case"s":return a;case"n":return parseFloat(a);case"b":return"1"===a}throw"invalid value: "+e}function s(e){return 1<=e.length&&"snb".includes(e[0])}Object.defineProperty(a,"__esModule",{value:!0}),a.Variable_storage=void 0;a.Variable_storage=class{static get_variable(e){e=localStorage.getItem(""+e);if("string"==typeof e&&s(e))return n(e)}static set_variable(e,t){localStorage.setItem(""+e,function(e){switch(typeof e){case"string":return"s"+e;case"number":return"n"+e;case"boolean":return e?"b1":"b0"}}(t))}static delete_variable(e){localStorage.removeItem(""+e)}static clear_all(){localStorage.clear()}static get variables(){var t={};for(let e=0;e<localStorage.length;e++){var a,r=localStorage.key(e);"string"==typeof r&&("string"==typeof(a=localStorage.getItem(r))&&s(a))&&(t[r]=n(a))}return t}}},{}]},{},[4]);
