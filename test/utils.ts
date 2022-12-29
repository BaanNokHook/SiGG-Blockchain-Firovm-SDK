import { readFileSync } from "fs";
import * as _ from "lodash";

export function lookupRPCFromFile(
  id: any,
  method: string,
  params: any[],
  content: any,
  exactly: boolean = false
) {
  if (!_.isArray(content)) {
    return null;
  }

  const responses: {
    method: string;
    params: any[];
    response: any;
  }[] = [];
  for (const entry of content) {
    if (!_.isArray(entry) && entry.length !== 3) {
      continue;
    }

    responses.push({
      method: entry[0],
      params: entry[1],
      response: entry[2],
    });
  }

  for (const r of responses) {
    if (method === r.method && _.isEqual(params, r.params)) {
      r.response["id"] = id;
      return r.response;
    }
  }

  if (!exactly) {
    do {
      for (const r of responses) {
        if (
          method === r.method &&
          _.isEqual(params, r.params.slice(0, params.length))
        ) {
          r.response["id"] = id;
          return r.response;
        }
      }
    } while (!_.isUndefined(params.pop()));
  }

  return null;
}
