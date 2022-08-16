// To parse this data:
//
//   import { Convert, Models } from "./file";
//
//   const models = Convert.toModels(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Models {
    "1"?: Config;
    "2"?: DbTradeEvent;
    "3"?: DbBocFake;
}

export interface Config {
    profiles: { [key: string]: DbProfile };
}

export interface DbProfile {
    tradeHistory: { [key: string]: DbTradeHistory };
}

export interface DbTradeHistory {
    option: DbOptionHistory[];
    orphan: string[];
    stock:  string[];
}

export interface DbOptionHistory {
    contract: DbOption;
    id:       string;
    tradeIds: string[];
}

export interface DbOption {
    expiryDate: Date;
    strike:     number;
    strikeFx:   DbFx;
    type:       string;
}

export interface DbFx {
    currency: string;
    rate:     number;
}

export interface DbTradeEvent {
    action:     string;
    date:       Date;
    id:         string;
    notes?:     string;
    options?:   DbOption;
    outlay:     number;
    outlayFx:   DbFx;
    price:      number;
    priceFx:    DbFx;
    raw?:       string;
    security:   string;
    settleDate: Date;
    shares:     number;
}

export interface DbBocFake {
    data: { [key: string]: { [key: string]: string } };
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toModels(json: string): Models {
        return cast(JSON.parse(json), r("Models"));
    }

    public static modelsToJson(value: Models): string {
        return JSON.stringify(uncast(value, r("Models")), null, 2);
    }

    public static toConfig(json: string): Config {
        return cast(JSON.parse(json), r("Config"));
    }

    public static configToJson(value: Config): string {
        return JSON.stringify(uncast(value, r("Config")), null, 2);
    }

    public static toDbProfile(json: string): DbProfile {
        return cast(JSON.parse(json), r("DbProfile"));
    }

    public static dbProfileToJson(value: DbProfile): string {
        return JSON.stringify(uncast(value, r("DbProfile")), null, 2);
    }

    public static toDbTradeHistory(json: string): DbTradeHistory {
        return cast(JSON.parse(json), r("DbTradeHistory"));
    }

    public static dbTradeHistoryToJson(value: DbTradeHistory): string {
        return JSON.stringify(uncast(value, r("DbTradeHistory")), null, 2);
    }

    public static toDbOptionHistory(json: string): DbOptionHistory {
        return cast(JSON.parse(json), r("DbOptionHistory"));
    }

    public static dbOptionHistoryToJson(value: DbOptionHistory): string {
        return JSON.stringify(uncast(value, r("DbOptionHistory")), null, 2);
    }

    public static toDbOption(json: string): DbOption {
        return cast(JSON.parse(json), r("DbOption"));
    }

    public static dbOptionToJson(value: DbOption): string {
        return JSON.stringify(uncast(value, r("DbOption")), null, 2);
    }

    public static toDbFx(json: string): DbFx {
        return cast(JSON.parse(json), r("DbFx"));
    }

    public static dbFxToJson(value: DbFx): string {
        return JSON.stringify(uncast(value, r("DbFx")), null, 2);
    }

    public static toDbTradeEvent(json: string): DbTradeEvent {
        return cast(JSON.parse(json), r("DbTradeEvent"));
    }

    public static dbTradeEventToJson(value: DbTradeEvent): string {
        return JSON.stringify(uncast(value, r("DbTradeEvent")), null, 2);
    }

    public static toDbBocFake(json: string): DbBocFake {
        return cast(JSON.parse(json), r("DbBocFake"));
    }

    public static dbBocFakeToJson(value: DbBocFake): string {
        return JSON.stringify(uncast(value, r("DbBocFake")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any = ''): never {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`, );
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "Models": o([
        { json: "1", js: "1", typ: u(undefined, r("Config")) },
        { json: "2", js: "2", typ: u(undefined, r("DbTradeEvent")) },
        { json: "3", js: "3", typ: u(undefined, r("DbBocFake")) },
    ], "any"),
    "Config": o([
        { json: "profiles", js: "profiles", typ: m(r("DbProfile")) },
    ], "any"),
    "DbProfile": o([
        { json: "tradeHistory", js: "tradeHistory", typ: m(r("DbTradeHistory")) },
    ], "any"),
    "DbTradeHistory": o([
        { json: "option", js: "option", typ: a(r("DbOptionHistory")) },
        { json: "orphan", js: "orphan", typ: a("") },
        { json: "stock", js: "stock", typ: a("") },
    ], "any"),
    "DbOptionHistory": o([
        { json: "contract", js: "contract", typ: r("DbOption") },
        { json: "id", js: "id", typ: "" },
        { json: "tradeIds", js: "tradeIds", typ: a("") },
    ], "any"),
    "DbOption": o([
        { json: "expiryDate", js: "expiryDate", typ: Date },
        { json: "strike", js: "strike", typ: 0 },
        { json: "strikeFx", js: "strikeFx", typ: r("DbFx") },
        { json: "type", js: "type", typ: "" },
    ], "any"),
    "DbFx": o([
        { json: "currency", js: "currency", typ: "" },
        { json: "rate", js: "rate", typ: 0 },
    ], "any"),
    "DbTradeEvent": o([
        { json: "action", js: "action", typ: "" },
        { json: "date", js: "date", typ: Date },
        { json: "id", js: "id", typ: "" },
        { json: "notes", js: "notes", typ: u(undefined, "") },
        { json: "options", js: "options", typ: u(undefined, r("DbOption")) },
        { json: "outlay", js: "outlay", typ: 3.14 },
        { json: "outlayFx", js: "outlayFx", typ: r("DbFx") },
        { json: "price", js: "price", typ: 3.14 },
        { json: "priceFx", js: "priceFx", typ: r("DbFx") },
        { json: "raw", js: "raw", typ: u(undefined, "") },
        { json: "security", js: "security", typ: "" },
        { json: "settleDate", js: "settleDate", typ: Date },
        { json: "shares", js: "shares", typ: 0 },
    ], "any"),
    "DbBocFake": o([
        { json: "data", js: "data", typ: m(m("")) },
    ], "any"),
};
