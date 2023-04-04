// "Hello Cornelia Cornington, nicknamed Corny. You might be wondering why I wrote this comment. Well Idk either, I just
// wanted to put something funny at the top of the index.ts so every time you open it, you have to use a few seconds of
// your life to appreciate the little things in life. Like this comment. Like and Subscribe.
// -Raf"
import Fastify from 'fastify';
import {doCall} from "./doCall";
import {doRequest} from "./api/render";
import {refetcher} from "./browsers/ChromeBrowser";
import cors from '@fastify/cors';
import admin from "firebase-admin";
import {makeWrappedRequest} from "./http/HttpsUtils";

// Initialize Firebase
admin.initializeApp();

const server = Fastify();
server.register(cors, {
  origin: '*',
  methods: ['GET', 'POST'],
});
server.post('/api', makeWrappedRequest(doCall));
server.get('*', makeWrappedRequest(doRequest));
server.listen({
  host: '0.0.0.0',
  port: 3_000,
}).then(() => console.log('Server is up and running!'));

// Only start the refetcher in prod
if (process.env.PROD) {
  console.log('Starting refetcher service!');
  refetcher.start();
}
