# GCal Sync

Sync calendar events to a calendar to another calendar.

## How to Use

### Initialization

```sh
npm i
```
```sh
npm run init
```

Edit files below:
- [appsscript.json](./src/appsscript.json)
  - fix timeZone as you want
- .env (created by init from [.env.template](.env.template))
  - `SOURCE_CALENDAR_ID`: for example: `primary`
  - `TARGET_CALENDAR_ID`: for example: `familyXXXXXXXXXXXXXXXXXXXX@group.calendar.google.com`
  - `TARGET_COLOR_ID`: for example `10` (see [here](https://google-calendar-simple-api.readthedocs.io/en/latest/colors.html#id2))


### Deploy

```sh
npm run push
```

### Set trigger for new events

1. Open app with `npx clasp open`
1. Open trigger settings through the left icons
1. Call `onCalenderEdit` function on "Calendar eventUpdate triggers"

### Sync past events (***MUST DO once for execution permission***)

1. Open app with `npx clasp open`
1. Run `processAll`.

 ***`processAll` may time out due to [Script runtime limitation](https://developers.google.com/apps-script/guides/services/quotas#current_limitations) but if it does, you can rerun it to resume from where it left off.***
