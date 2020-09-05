require('dotenv').config();
const { App } = require('@slack/bolt');
const fs = require('fs');

const app = new App({
  token: process.env.SLACK_OAUTH_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const allowedUsers = JSON.parse(fs.readFileSync('allowedUsers.json', 'utf-8'));

const userIsAdmin = async (userId) => {
  try {
    console.log(`looking up user ${await userId}`);
    const res = (
      await app.client.users.info({
        token: process.env.SLACK_OAUTH_TOKEN,
        user: await userId,
      })
    ).user.is_admin;

    return res || allowedUsers.includes(userId);
  } catch (err) {
    console.error(err);
    return false;
  }
};

const botInChannel = async (channel) => {
  try {
    const res = await app.client.conversations.info({
      token: process.env.SLACK_OAUTH_TOKEN,
      channel: channel,
    });
    return await res.channel.is_member;
  } catch (err) {
    console.error(err);
  }
};

const joinChannel = async (channel) => {
  try {
    await app.client.conversations.join({
      token: process.env.SLACK_OAUTH_TOKEN,
      channel: channel,
    });
  } catch (err) {
    console.error(err);
  }
};

const deleteThread = async (channel, topMessageTs) => {
  try {
    if (!(await botInChannel(channel))) {
      console.log('Joining channel');
      await joinChannel(channel);
    }
    console.log(`deleting for thread ${topMessageTs} in channel ${channel}`);
    for await (let page of app.client.paginate('conversations.replies', {
      channel: channel,
      token: process.env.SLACK_OAUTH_TOKEN,
      ts: topMessageTs,
    })) {
      let m = await page.messages;
      for (const i of await m) {
        // This checks if you've run it on a message in a thread, and gets the top level message instead
        if (m.length === 1 && i.hasOwnProperty('thread_ts')) {
          await deleteThread(channel, i.thread_ts);
          break;
        }
        if ((await i.user) !== 'USLACKBOT') {
          console.log(`Deleting ${i.ts} ("${i.text}")`);
          await app.client.chat.delete({
            token: process.env.SLACK_ADMIN_TOKEN,
            ts: i.ts,
            channel: channel,
          });
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
};

app.shortcut('purge_thread', async ({ shortcut, ack, respond }) => {
  try {
    await ack();
    if (!(await userIsAdmin(shortcut.user.id))) {
      console.log("User isn't an admin, warning them.");
      await app.client.chat.postEphemeral({
        token: process.env.SLACK_OAUTH_TOKEN,
        channel: shortcut.channel.id,
        user: shortcut.user.id,
        text: "Sorry, you can't do that!",
      });
      throw 'UserNotAuthed';
    }

    await deleteThread(shortcut.channel.id, shortcut.message_ts);
  } catch (err) {
    console.error(err);
  }
});

//stuff
(async () => {
  await app.start(3000);
  console.log('hi there');
})();
