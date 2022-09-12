# whistleblower

### Setup

1. Run:
```bash
$ git clone https://github.com/phxgg/whistleblower.git
$ cd ./whistleblower
```

2. Rename `config.json.example` to `config.json` and fill in the values.
```json
{
  "mongodb_uri": "<Your mongodb URI>",
  "token": "<Your bot's token>",
  "application_id": "<Your application's id>",

  "logging_channel_ids": {
    "message_deleted": "<Channel id to keep track of deleted messages>",
    "message_edited": "<Channel id to keep track of edited messages>"
  },

  "track_all_channels_by_default": true,

  "exclude_channel_ids": [
    "<Each row is a Channel id to exclude from tracking automatically>"
  ]
}
```

3. Run:
```bash
$ npm install
$ npm run register
$ npm run bot
```

### TODO:

* Store Logging Channel IDs in database (such as channel IDs for messageDeleted or messageUpdated event).

* Seems like when joining a new guild, the bot doesn't register commands in that new guild. Maybe register commands on `guildJoin` event?

* Command to set a channel for each event & display warning if channel is not set

* Command to set all events to one channel

* Commands to track/untrack all channels with option to exclude specific channels

* Implement a database to store and load the data. Include on guild join and leave events to add/remove the guild data from the database.

* <s>Fix attachments not being logged</s>
* <s>Check if attachments are same in original and edited messages. If they are, don't display attachments in the edited message log.</s>
