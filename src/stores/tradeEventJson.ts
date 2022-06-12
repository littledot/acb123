// To parse this data:
//
//   import { Convert, TradeEventJson } from "./file";
//
//   const tradeEventJson = Convert.toTradeEventJson(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface TradeEventJson {
  id:         string;
  security:   string;
  date:       Date;
  settleDate: Date;
  action:     string;
  shares:     number;
  price:      number;
  priceFx:    Fx;
  outlay:     number;
  outlayFx:   Fx;
  options?:    OptionsJson;
  raw:        string;
}

export interface OptionsJson {
  strikeFx:   Fx;
  type:       string;
  expiryDate: Date;
  strike:     number;
}

export interface Fx {
  currency: string;
  rate:     number;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toTradeEventJson(json: string): TradeEventJson {
      return cast(JSON.parse(json), r("TradeEventJson"));
  }

  public static tradeEventJsonToJson(value: TradeEventJson): string {
      return JSON.stringify(uncast(value, r("TradeEventJson")), null, 2);
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
  "TradeEventJson": o([
      { json: "id", js: "id", typ: "" },
      { json: "security", js: "security", typ: "" },
      { json: "date", js: "date", typ: Date },
      { json: "settleDate", js: "settleDate", typ: Date },
      { json: "action", js: "action", typ: "" },
      { json: "shares", js: "shares", typ: 0 },
      { json: "price", js: "price", typ: 3.14 },
      { json: "priceFx", js: "priceFx", typ: r("Fx") },
      { json: "outlay", js: "outlay", typ: 3.14 },
      { json: "outlayFx", js: "outlayFx", typ: r("Fx") },
      { json: "options", js: "options", typ: r("OptionsJson") },
      { json: "raw", js: "raw", typ: "" },
  ], false),
  "OptionsJson": o([
      { json: "strikeFx", js: "strikeFx", typ: r("Fx") },
      { json: "type", js: "type", typ: "" },
      { json: "expiryDate", js: "expiryDate", typ: Date },
      { json: "strike", js: "strike", typ: 0 },
  ], false),
  "Fx": o([
      { json: "currency", js: "currency", typ: "" },
      { json: "rate", js: "rate", typ: 0 },
  ], false),
};
