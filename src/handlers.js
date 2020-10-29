import {
  botInChannel,
  joinChannel,
  userIsAdmin,
  logDeletion,
  deleteThread,
  deleteMessage,
  getTopLevel,
  warnUser
} from './utils.js';
import 'dotenv/config';

export const purgeThreadHandler = async ({ shortcut, ack }) => {
  try {
    // Acknowledge shortcut request with a 200 OK
    await ack();

    // declarations
    const shortcut_channel = shortcut.channel.id;
    const shortcut_user = shortcut.user.id;
    const shortcut_ts = shortcut.message.ts;

    /* Checks if bot is in the channel, and joins if not */
    if (!(await botInChannel(shortcut_channel))) {
      console.log(`Joining channel ${shortcut_channel}!`);
      await joinChannel(shortcut_channel);
    }

    /* Check if user is an admin or not */
    if (!(await userIsAdmin(shortcut_user))) {
      await warnUser(
        shortcut_user,
        shortcut_channel,
        "Sorry, you can't do that!"
      );
      console.log(`${shortcut_user} wasn't authed!`);
      return;
    }

    // Get ts of parent message
    const parent_ts = await getTopLevel(shortcut_channel, shortcut_ts);
    // send parent message to logger
    await logDeletion(shortcut_channel, parent_ts, shortcut_user, true);

    /* Delete the thread */
    await deleteThread(shortcut_channel, shortcut_ts);
  } catch (err) {
    console.error(err);
  }
};

export const deleteMessageHandler = async ({ shortcut, ack }) => {
  try {
    // Acknowledge shortcut request with a 200 OK
    await ack();

    // declarations
    const shortcut_channel = shortcut.channel.id;
    const shortcut_user = shortcut.user.id;
    const shortcut_ts = shortcut.message.ts;

    /* Checks if bot is in the channel, and joins if not */
    if (!(await botInChannel(shortcut_channel))) {
      console.log(`Joining channel ${shortcut_channel}!`);
      await joinChannel(shortcut_channel);
    }

    /* Check if user is an admin or not */
    if (!(await userIsAdmin(shortcut_user))) {
      await warnUser(
        shortcut_user,
        shortcut_channel,
        "Sorry, you can't do that!"
      );
      return;
    }

    // log message
    await logDeletion(shortcut_channel, shortcut_ts, shortcut_user, false);
    // delete message
    await deleteMessage({
      channel: shortcut_channel,
      ts: shortcut_ts
    });
  } catch (err) {
    console.error(err);
  }
};
