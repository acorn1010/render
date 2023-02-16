import express from "express";
import {env} from "../Environment";
import {DELETE_PATTERN} from "../db/lua";

export async function flush(req: express.Request, res: express.Response) {
  if (!req.user?.userId) {
    console.error('How is this possible? I thought we were authed!', req);
    res.status(400).send(JSON.stringify({error: 'Invalid auth token.'}));
    return;
  }

  // TODO(acorn1010): Allow partial cache invalidations (e.g. "com.*", "com.foony.*").
  const {userId} = req.user;
  const result = await env.redis.eval(DELETE_PATTERN, 1, `{users:${userId}}`, `{users:${userId}}:urls:*`);
  console.log('Deleted all cache for user!', userId, result);
  res.send(JSON.stringify({data: true}));
}
