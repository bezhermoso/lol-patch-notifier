# LoL Patch Notifier

Uses LoL's Static Data API to check if there is any new patches, and notifies
subscribers about them.

### Installation

```
> git clone git@github.com/bezhermoso/lol-patch-notifier.git .
> npm install
```

### Usage

It only comes with Slack integration for now.

```
> node cmd.js slack https://hooks.slack.com/services/... --since=5.18 --frequency=60
```

This will check for any patches after Patch 5.19 every hour (60 minutes), and
notifies the channel/user on Slack with which the incoming webhook integration
was configured to post to.

<img src="http://i.imgur.com/dPe3jfG.png" />
