import {env} from "../Environment";
import {CallableContext} from "../http/CallableContext";
import {getUserId} from "../http/AuthUtils";
import {ServerAction} from "../ServerAction";

export const refreshToken: ServerAction<'refreshToken'> = async (context: CallableContext) => {
  return env.redis.user.refreshToken(getUserId(context));
};
