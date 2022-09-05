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
  "token": "<Your bot's token>",
  "application_id": "<Your application's id>",

  "logging_channel_ids": {
    "message_deleted": "<Channel id to keep track of deleted messages>",
    "message_edited": "<Channel id to keep track of edited messages>"
  },

  "track_all_channels_by_default": true,

  "exclude_channel_ids": [
    "<Each row is a Channel id to exclude from tracking automatically"
  ]
}
```

3. Run:
```bash
$ npm install
$ npm run register [guild id]
$ npm run bot
```

### TODO:

1. <s>Fix attachments not being logged</s>
2. Command to set a channel for each event & display warning if channel is not set
3. Command to set all events to one channel
4. Commands to track/untrack all channels with option to exclude specific channels
5. Check if attachments are same in original and edited messages. If they are, don't display attachments in the edited message log.
6. <b>Later on:</b> Implement a database to store and load the data. Include on guild join and leave events to add/remove the guild data from the database.
