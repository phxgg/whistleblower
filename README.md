# whistleblower

### Setup

1. Rename `config.json.example` to `config.json` and fill in the values.
```json
{
  "token": "<Your bot's token>",
  "application_id": "<Your application's id>",

  "logging_channel_ids": {
    "message_deleted": "<Channel id to keep track of deleted messages>",
    "message_edited": "<Channel id to keep track of edited messages>"
  }
}
```

2. Run:
```bash
npm install
npm run register [guild id]
npm run bot
```
