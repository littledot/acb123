// To parse this data:
//
//   import { Convert, Root, TradeEventJson } from "./file";
//
//   const root = Convert.toRoot(json);
//   const tradeEventJson = Convert.toTradeEventJson(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Root {
    "1"?: Config;
}

export interface Config {
    profiles: { [key: string]: ProfileJson };
}

export interface ProfileJson {
    tradeIds: { [key: string]: string[] };
}

export interface TradeEventJson {
    action:     string;
    date:       Date;
    id:         string;
    options?:   OptionJson;
    outlay:     number;
    outlayFx:   FxJson;
    price:      number;
    priceFx:    FxJson;
    raw:        string;
    security:   string;
    settleDate: Date;
    shares:     number;
}

export interface OptionJson {
    expiryDate: Date;
    strike:     number;
    strikeFx:   FxJson;
    type:       string;
}

export interface FxJson {
    currency: string;
    rate:     number;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toRoot(json: string): Root {
        return cast(JSON.parse(json), r("Root"));
    }

    public static rootToJson(value: Root): string {
        return JSON.stringify(uncast(value, r("Root")), null, 2);
    }

    public static toConfig(json: string): Config {
        return cast(JSON.parse(json), r("Config"));
    }

    public static configToJson(value: Config): string {
        return JSON.stringify(uncast(value, r("Config")), null, 2);
    }

    public static toProfileJson(json: string): ProfileJson {
        return cast(JSON.parse(json), r("ProfileJson"));
    }

    public static profileJsonToJson(value: ProfileJson): string {
        return JSON.stringify(uncast(value, r("ProfileJson")), null, 2);
    }

    public static toTradeEventJson(json: string): TradeEventJson {
        return cast(JSON.parse(json), r("TradeEventJson"));
    }

    public static tradeEventJsonToJson(value: TradeEventJson): string {
        return JSON.stringify(uncast(value, r("TradeEventJson")), null, 2);
    }

    public static toOptionJson(json: string): OptionJson {
        return cast(JSON.parse(json), r("OptionJson"));
    }

    public static optionJsonToJson(value: OptionJson): string {
        return JSON.stringify(uncast(value, r("OptionJson")), null, 2);
    }

    public static toFxJson(json: string): FxJson {
        return cast(JSON.parse(json), r("FxJson"));
    }

    public static fxJsonToJson(value: FxJson): string {
        return JSON.stringify(uncast(value, r("FxJson")), null, 2);
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
    "Root": o([
        { json: "1", js: "1", typ: u(undefined, r("Config")) },
    ], "any"),
    "Config": o([
        { json: "profiles", js: "profiles", typ: m(r("ProfileJson")) },
    ], "any"),
    "ProfileJson": o([
        { json: "tradeIds", js: "tradeIds", typ: m(a("")) },
    ], "any"),
    "TradeEventJson": o([
        { json: "action", js: "action", typ: "" },
        { json: "date", js: "date", typ: Date },
        { json: "id", js: "id", typ: "" },
        { json: "options", js: "options", typ: u(undefined, r("OptionJson")) },
        { json: "outlay", js: "outlay", typ: 3.14 },
        { json: "outlayFx", js: "outlayFx", typ: r("FxJson") },
        { json: "price", js: "price", typ: 3.14 },
        { json: "priceFx", js: "priceFx", typ: r("FxJson") },
        { json: "raw", js: "raw", typ: "" },
        { json: "security", js: "security", typ: "" },
        { json: "settleDate", js: "settleDate", typ: Date },
        { json: "shares", js: "shares", typ: 0 },
    ], "any"),
    "OptionJson": o([
        { json: "expiryDate", js: "expiryDate", typ: Date },
        { json: "strike", js: "strike", typ: 0 },
        { json: "strikeFx", js: "strikeFx", typ: r("FxJson") },
        { json: "type", js: "type", typ: "" },
    ], "any"),
    "FxJson": o([
        { json: "currency", js: "currency", typ: "" },
        { json: "rate", js: "rate", typ: 0 },
    ], "any"),
};
