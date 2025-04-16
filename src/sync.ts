type CalendarEvent = GoogleAppsScript.Calendar.Schema.Event;
type Config = ReturnType<typeof getConfig>;

function onCalendarEdit() {
  const config = getConfig();

  const scriptProperties = PropertiesService.getScriptProperties();
  const properties = scriptProperties.getProperties();

  let events = getEvents(config.sourceCalendarId, { syncToken: properties.syncToken });
  while (properties.syncToken && events && events.items) {
    syncEvent(events.items, config);
    if (events.nextPageToken) {
      events = getEvents(config.sourceCalendarId, { pageToken: events.nextPageToken });
    } else {
      break;
    }
  }

  scriptProperties.setProperty("syncToken", events?.nextSyncToken ?? "");
  console.log(scriptProperties.getProperties());
}

function processAll() {
  const config = getConfig();

  const scriptProperties = PropertiesService.getScriptProperties();
  const properties = scriptProperties.getProperties();

  let events = getEvents(config.sourceCalendarId, { pageToken: properties.pageToken ?? undefined });
  while (properties.syncToken && events && events.items) {
    syncEvent(events.items, config);
    if (events.nextPageToken) {
      scriptProperties.setProperty("pageToken", events?.nextPageToken ?? "");
      events = getEvents(config.sourceCalendarId, { pageToken: events.nextPageToken });
    } else {
      break;
    }
  }
  scriptProperties.deleteProperty("pageToken");
}

function getEvents(calendarId: string, option: { syncToken?: string, pageToken?: string } = {}) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Calendar.Events?.list(
      calendarId,
      {
        ...option,
        maxResults: 9999,
        timeMin: today.toISOString(),
      },
    );
  } catch (e) {
    if (e instanceof Error) {
      console.log(e);
    }
    throw e;
  }
}

function syncEvent(events: GoogleAppsScript.Calendar.Schema.Event[], config: Config) {
  events.forEach((event) => {
    const newEvent = {
      ...event,
      colorId: config.targetColorId,
    };

    console.log(event);
    let existingEvent: CalendarEvent | undefined;
    if (event.id) {
      try {
        existingEvent = Calendar.Events?.get(config.targetCalendarId, event.id);
        Calendar.Events?.update(newEvent, config.targetCalendarId, event.id, { sendUpdates: 'none' });
        console.log("update existing event");
        return;
      } catch (e) {
        console.log(e);
      }
      try {
        if (event.status === 'cancelled') {
          if (existingEvent) {
            Calendar.Events?.remove(config.targetCalendarId, event.id!, { sendUpdates: 'none' });
            console.log("removed existing event");
          }``
        } else {
          Calendar.Events?.insert(newEvent, config.targetCalendarId, { sendUpdates: 'none' });
          console.log("inserted new event");
        }
      } catch (e) {
        console.log(e);
      }
    }
  })
}

function getConfig() {
  return {
    sourceCalendarId: ENV.SOURCE_CALENDAR_ID,
    targetCalendarId: ENV.TARGET_CALENDAR_ID,
    targetColorId: ENV.TARGET_COLOR_ID,
  };
}
