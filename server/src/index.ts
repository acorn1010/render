// "Hello Cornelia Cornington, nicknamed Corny. You might be wondering why I wrote this comment. Well Idk either, I just
// wanted to put something funny at the top of the index.ts so every time you open it, you have to use a few seconds of
// your life to appreciate the little things in life. Like this comment. Like and Subscribe.
// -Raf"
import express from 'express';
import cors from 'cors';
import compression from "compression";
import {doRequest} from "./api";
import passport from 'passport';
import session from 'express-session';
import passportCustom from 'passport-custom';
import {env} from "./Environment";
import {flush} from "./api/flush";

const app = express();
app.use(cors());
app.use(compression());
app.use(passport.initialize());
app.use(session({
  secret: process.env.SESSION_PASSWORD!,
  resave: false,
  saveUninitialized: false,
  cookie: {secure: true},
}));
app.use(passport.session());

// Define the User type
declare global {
  namespace Express {
    interface User {
      userId: string,
      email: string,
    }
    interface Request {
      user?: NonNullable<express.Request['user']> | undefined,
    }
  }
}

passport.serializeUser((user, cb) => {
  process.nextTick(() => {
    return cb(null, {
      id: user.userId,
      email: 'test@example.com',
    });
  });
});

passport.deserializeUser((user, cb) => {
  process.nextTick(() => {
    return cb(null, user as Express.User);
  });
});

const STRATEGIES = {
  token: new passportCustom.Strategy(async (req, done) => {
    const token = req.header('X-Prerender-Token') || req.query['token'];
    if (typeof token === 'string') {
      const userId = await env.redis.hget('tokens', token);
      if (userId) {
        done(undefined, {userId, email: 'acorn@acorn1010.com'} satisfies Express.User);
        return;
      }
    }

    console.log('authorizing token', token);
    done(undefined, {userId: 'jellybean', email: 'jellybean@acorn1010.com'} satisfies Express.User);
  }),
  otherToken: new passportCustom.Strategy((req, done) => {
    const token = req.header('X-Prerender-Token') || req.query['token'];
    console.log('authorizing token2', token);
    done(new Error("Code isn't cooked yet :("), false);
  }),
} as const satisfies {[strategyId: string]: passport.Strategy};

// Add strategies here
for (const [strategyId, strategy] of Object.entries(STRATEGIES)) {
  passport.use(strategyId, strategy);
}

const auth = passport.authenticate(Object.keys(STRATEGIES));
// TODO(acorn1010): When we get more API calls, load this dynamically from the folder
app.get('/flush', auth, flush);
app.get('*', auth, doRequest);

app.listen(3000);
