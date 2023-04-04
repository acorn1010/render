import Redis from "ioredis";
import * as dotenv from 'dotenv';
import {RedisWrapper} from "./db/RedisWrapper";
import Ajv from "ajv";
import {Actions} from 'render-shared-library/lib/Action';
import * as apiSchema from 'render-shared-library/lib/api_schema.json';
import {ServerActions} from "./api";
dotenv.config();

type ValidateFunction = import('ajv').ValidateFunction<any>;

/** The global environment. */
export const env = {
  redis: new RedisWrapper(
      new Redis({
        host: 'redis-service.redis.svc.cluster.local',
        /** Use DB 1 because we're using db-0 for Foony. */
        db: 1,
        password: process.env.REDIS_PASSWORD,
      })
  ),
  validators: makeValidators(),
  // Vitess <-- maybe just Redis? PostgresQL is another good choice here
  // Kafka <-- maybe just Redis for now?
} as const;

/** Create all API schema validators. Not all Action Options have a validator. */
function makeValidators(): Map<keyof Actions, ValidateFunction> {
  const ajv = (new Ajv()).addSchema(apiSchema);
  const result = new Map<keyof Actions, ValidateFunction>();

  // Note: It's possible below that the schemas are malformed. We use ! operators anyways because if
  // a schema is missing, it's unsafe to run the game server, so it's better to fail.

  // Next, we add all of the non-generic actions.
  // const actionOptions = ajv.getSchema('#/definitions/Actions')!;
  // const properties = (actionOptions.schema as SchemaObject)?.properties!;
  for (const action in ServerActions) {
    const maybeValidator = ajv.getSchema(`#/definitions/ActionInputs/properties/${action}`);
    if (!maybeValidator) {
      throw new Error(`Missing API action schema: ${action}`);
    }
    result.set(action as keyof typeof ServerActions, maybeValidator);
  }

  return result;
}
