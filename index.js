require('dotenv').config();
const { App } = require('@slack/bolt');

const linkRegex = /https:\/\/hackclub\.slack\.com\/archives\/([CG][A-Z0-9]+)\/p([0-9]+)(?:.+)?/;

const app = new App({
    token: process.env.SLACK_OAUTH_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const userIsAdmin = async (userId) => {
    try {
        console.log(`looking up user ${await userId}`);
        const res = await app.client.users.info({
            token: process.env.SLACK_OAUTH_TOKEN,
            user: await userId,
        });

        return await res.user.is_admin;
    } catch (err) {
        console.error(err);
    }
};

const deleteThread = async (channel, topMessageTs) => {
    try {
        console.log(
            `deleting for thread ${topMessageTs} in channel ${channel}`
        );
        for await (let page of app.client.paginate('conversations.replies', {
            channel: channel,
            token: process.env.SLACK_OAUTH_TOKEN,
            ts: topMessageTs,
        })) {
            let m = await page.messages;
            for (const i of await m) {
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

app.message(linkRegex, async ({ message }) => {
    try {
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

        await app.client.reactions.add({
            token: process.env.SLACK_OAUTH_TOKEN,
            timestamp: message.ts,
            name: 'beachball',
            channel: message.channel,
        });

        const channelId = await message.text.match(linkRegex)[1];
        const tsre = await message.text.match(linkRegex)[2];

        const ts = `${tsre.substring(0, 10)}.${tsre.substring(10, 17)}`;

        await deleteThread(channelId, ts);
        await app.client.reactions.remove({
            token: process.env.SLACK_OAUTH_TOKEN,
            timestamp: message.ts,
            channel: message.channel,
            name: 'beachball',
        });
        app.client.reactions.add({
            token: process.env.SLACK_OAUTH_TOKEN,
            timestamp: message.ts,
            channel: message.channel,
            name: 'heavy_check_mark',
        });
    } catch (err) {
        console.error(err);
    }
});

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
