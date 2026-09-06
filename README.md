# whistleblower

> **Note**
> This project is under development. The documentation is not complete and the code is optimized for my own use.

### Configuration

The bot is configured with environment variables. Copy `.env.example` to `.env` and fill in the values:

```bash
$ cp .env.example .env
```

| Variable                        | Required | Default     | Description                                             |
| ------------------------------- | -------- | ----------- | ------------------------------------------------------- |
| `MONGODB_URI`                   | yes      |             | MongoDB connection string                               |
| `TOKEN`                         | yes      |             | Bot token                                               |
| `APPLICATION_ID`                | yes      |             | Application id                                          |
| `REDIS_ENABLE`                  | no       | `false`     | Enable the redis query cache                            |
| `REDIS_HOST`                    | no       | `127.0.0.1` | Redis host (`redis` when running with Docker Compose)   |
| `REDIS_PORT`                    | no       | `6379`      | Redis port                                              |
| `REDIS_PASSWORD`                | no       |             | Leave empty if no password is set                       |
| `LOG_TO_FILE`                   | no       | `true`      | Write logs to `logs/error.log` and `logs/combined.log`  |
| `TRACK_ALL_CHANNELS_BY_DEFAULT` | no       | `true`      | Track every channel of a guild on join                  |
| `UPLOAD_ATTACHMENTS`            | no       | `false`     | Upload attachments somewhere that outlives the message  |
| `UPLOAD_PROVIDER`               | no       | `safenote`  | `safenote` or `nextcloud`                               |
| `NEXTCLOUD_URL`                 | nextcloud|             | Base url of the instance, e.g. `https://cloud.example.com` |
| `NEXTCLOUD_USERNAME`            | nextcloud|             | User the files are uploaded as                          |
| `NEXTCLOUD_APP_PASSWORD`        | nextcloud|             | App password of that user                               |
| `NEXTCLOUD_PATH`                | no       | `whistleblower` | Folder the attachments are uploaded to, created if missing |
| `EXCLUDE_CHANNEL_IDS`           | no       |             | Channel ids never tracked automatically                 |
| `BANNED_USER_IDS`               | no       |             | User ids banned from using the bot                      |

Id lists accept commas, newlines, or both:

```bash
EXCLUDE_CHANNEL_IDS=111,222
EXCLUDE_CHANNEL_IDS="111
222"
```

Missing required variables make the bot exit on start with the name of the missing one. The `nextcloud` ones are only required when `UPLOAD_ATTACHMENTS=true` and `UPLOAD_PROVIDER=nextcloud`.

#### Attachments

Attachments of a deleted or edited message stay on the discord cdn only as long as the message does, so `UPLOAD_ATTACHMENTS=true` copies them somewhere they survive:

* `safenote` uploads to [SafeNote](https://safenote.co/), which deletes the file again after 3 days.
* `nextcloud` uploads to your own instance over WebDAV and creates a public read only share link. Create the app password under *Settings > Security > Devices & sessions*, and make sure public link sharing is enabled, otherwise the file is uploaded but the embed falls back to the cdn url.

Either way, attachments over 20MB and failed uploads fall back to linking the discord cdn.

### Setup

```bash
$ git clone https://github.com/phxgg/whistleblower.git
$ cd ./whistleblower
$ npm install
$ npm run register
$ npm run bot
```

`.env` is loaded automatically, and ignored if it does not exist, in which case the variables are read from the environment.

Commands are registered globally, so they are available in every guild the bot joins without re-running `npm run register`. If they do not show up in a guild, the bot was invited without the `applications.commands` scope, or the global registration has not propagated yet.

### Commands

All commands require the Administrator permission.

| Command                                   | Description                                                       |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `/log message_delete channel:`            | Log deleted messages in a channel                                 |
| `/log message_update channel:`            | Log edited messages in a channel                                  |
| `/log all channel:`                       | Log every event in a single channel                               |
| `/log list`                               | Show the logging channel of every event                           |
| `/track [channel:]`                       | Track a channel, defaults to the current one                      |
| `/track all: true [exclude:]`             | Track every text and voice channel, except the excluded ones      |
| `/untrack [channel:]`                     | Untrack a channel, defaults to the current one                    |
| `/untrack all: true [exclude:]`           | Untrack every tracked channel, except the excluded ones           |

`exclude` accepts channel mentions or ids, separated by commas, spaces or newlines. `EXCLUDE_CHANNEL_IDS` is always excluded on top of it.

Deleted channels are removed from the tracked channels and from the logging channels automatically.

### Docker

MongoDB is expected to be an external service, so set `MONGODB_URI` accordingly. Redis runs alongside the bot, which is why `.env` should use `REDIS_HOST=redis`.

```bash
$ docker compose run --rm bot npm run register   # once, to register the commands
$ docker compose up -d
```

When deploying to a platform that injects environment variables (Coolify, for example), no `.env` file is needed. Set the variables there instead.

### TODO:

* Review `uploadAttachment` function in `src/services/attachments.service.js`
