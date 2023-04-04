import {FastifyReply, FastifyRequest} from "fastify";
import {Actions} from "render-shared-library/lib/Action";
import {env} from "./Environment";
import {HttpsError} from "./http/HttpsError";
import {ServerActions} from "./api";
import {isArray, isBoolean, isObject, isString, map, mapValues} from "lodash";
import {CallableContext} from "./http/CallableContext";

type FastifyActionTypes =
    {[K in keyof Actions]: {Body: {a: keyof Actions, d: Actions[keyof Actions]['input']}, Reply: Actions[K]['output']}};
export async function doCall(
    req: FastifyRequest<FastifyActionTypes[keyof FastifyActionTypes]>,
    res: FastifyReply,
    context: CallableContext) {
  const {a: action, d: data} = req.body;
  const validator = env.validators.get(action);
  if (!validator) {
    console.warn('Missing validator:', action);
    throw new HttpsError('failed-precondition', 'Bad request');
  } else if (!validator(data)) {
    console.dir('Bad client request', validator.errors);
    throw new HttpsError('failed-precondition', "Bad client request. Try refreshing your browser's cache.");
  }

  const result = await (ServerActions[action] as any)(context, data);
  res.status(200).send(JSON.stringify({d: encode(result)}));
}

/**
 * Encodes arbitrary data in our special format for JSON.
 *
 * "Inspired" by Firebase's encode method, but with extra support for removing Promise types which
 * are used internally by the server to guarantee order of execution while returning quickly to the
 * user.
 */
export function encode(paramData: any): any {
  let data = paramData;
  if (data === null || data === undefined) {
    return null;
  }
  // Oddly, isFinite(new Number(x)) always returns false, so unwrap Numbers.
  if (data instanceof Number) {
    data = data.valueOf();
  }
  if (isFinite(data)) {
    // Any number in JS is safe to put directly in JSON and parse as a double
    // without any loss of precision.
    return data;
  }
  if (isBoolean(data)) {
    return data;
  }
  if (isString(data)) {
    return data;
  }
  if (isArray(data)) {
    return map(data, encode);
  }
  if (isObject(data)) {
    if (data instanceof Promise) {
      return null;
    }
    // It's not safe to use forEach, because the object might be 'array-like'
    // if it has a key called 'length'. Note that this intentionally overrides
    // any toJSON method that an object may have.
    return mapValues(data, encode);
  }
  // If we got this far, the data is not encodable.
  console.error('Data cannot be encoded in JSON.', data);
  throw new Error('Data cannot be encoded in JSON: ' + data);
}
