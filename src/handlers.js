import {
  botInChannel,
  joinChannel,
  userIsAdmin,
  logDeletion,
  deleteThread
} from './utils.js';
import 'dotenv/config';

export const purgeThreadHandler = async ({ shortcut, ack, client }) => {
  try {
    // Acknowledge shortcut request with a 200 OK
    await ack();

    // declare shit
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
      await client.chat.postEphemeral({
        token: process.env.SLACK_OAUTH_TOKEN,
        channel: shortcut_channel,
        user: shortcut_user,
        text: "Sorry, you can't do that!"
      });

      console.log(`${shortcut_user} wasn't authed!`);
      return;
    }

    /* Posts the top level message to admin channel */
    await logDeletion(shortcut_channel, shortcut_ts);

    /* Delete the thread */
    await deleteThread(shortcut_channel, shortcut_ts);
  } catch (err) {
    console.error(err);
  }
};
