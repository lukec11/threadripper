require('dotenv').config();
const { App } = require('@slack/bolt');
const fs = require('fs');

export const app = new App({
  token: process.env.SLACK_OAUTH_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

export const allowedUsers = JSON.parse(
  fs.readFileSync(__dirname + '/../static/allowedUsers.json', 'utf-8')
);

import { purgeThreadHandler, deleteMessageHandler } from './handlers.js';

app.shortcut('purge_thread', purgeThreadHandler);
app.shortcut('delete_msg', deleteMessageHandler);

(async () => {
  await app.start(3000);
  console.log('listening on 3000');
})();
