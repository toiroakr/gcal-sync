type CalendarEvent = GoogleAppsScript.Calendar.Schema.Event;
type Config = ReturnType<typeof getConfig>;

function onCalendarEdit() {
  const config = getConfig();

  const scriptProperties = PropertiesService.getScriptProperties();
  const properties = scriptProperties.getProperties();

  let events = getEvents(config.sourceCalendarId, {
    syncToken: properties.syncToken,
  });
  while (properties.syncToken && events && events.items) {
    syncEvent(events.items, config);
    if (events.nextPageToken) {
      events = getEvents(config.sourceCalendarId, {
        pageToken: events.nextPageToken,
      });
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

  let events = getEvents(config.sourceCalendarId, {
    pageToken: properties.pageToken ?? undefined,
  });
  while (events && events.items) {
    syncEvent(events.items, config);
    if (events.nextPageToken) {
      scriptProperties.setProperty("pageToken", events?.nextPageToken ?? "");
      events = getEvents(config.sourceCalendarId, {
        pageToken: events.nextPageToken,
      });
    } else {
      break;
    }
  }
  scriptProperties.deleteProperty("pageToken");
}

function reverseCheck() {
  const config = getConfig();

  const scriptProperties = PropertiesService.getScriptProperties();
  const properties = scriptProperties.getProperties();

  let events = getEvents(config.targetCalendarId, {
    pageToken: properties.reversePageToken ?? undefined,
  });
  while (events && events.items) {
    reverseSyncEvent(events.items, config);
    if (events.nextPageToken) {
      scriptProperties.setProperty(
        "reversePageToken",
        events?.nextPageToken ?? "",
      );
      events = getEvents(config.targetCalendarId, {
        pageToken: events.nextPageToken,
      });
    } else {
      break;
    }
  }
  scriptProperties.deleteProperty("reversePageToken");
}

function getEvents(
  calendarId: string,
  option: { syncToken?: string; pageToken?: string } = {},
) {
  try {
    const options: Record<string, string> = { ...option };
    if (!options.syncToken) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextMonth = new Date(today.getTime());
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      options.timeMin = today.toISOString();
      options.timeMax = nextMonth.toISOString();
    }

    return Calendar.Events?.list(
      calendarId,
      {
        ...options,
        maxResults: 9999,
      },
    );
  } catch (e) {
    if (e instanceof Error) {
      console.log(e);
    }
    throw e;
  }
}

function syncEvent(
  events: GoogleAppsScript.Calendar.Schema.Event[],
  config: Config,
) {
  events
    .forEach((event) => {
      const newEvent = {
        ...event,
        colorId: config.targetColorId,
      };

      console.log(event);
      let existingEvent: CalendarEvent | undefined;
      if (event.id) {
        try {
          existingEvent = Calendar.Events?.get(config.targetCalendarId, event.id);
          Calendar.Events?.update(newEvent, config.targetCalendarId, event.id, {
            sendUpdates: "none",
          }, { "If-Match": existingEvent?.etag });
          console.log("update existing event");
          return;
        } catch (e) {
          console.log(e);
        }
        try {
          if (event.status === "cancelled") {
            if (existingEvent) {
              Calendar.Events?.remove(config.targetCalendarId, event.id!, {
                sendUpdates: "none",
              });
              console.log("removed existing event");
            }
          } else {
            Calendar.Events?.insert(newEvent, config.targetCalendarId, {
              sendUpdates: "none",
            });
            console.log("inserted new event");
          }
        } catch (e) {
          console.log(e);
        }
      }
    });
}

function reverseSyncEvent(
  events: GoogleAppsScript.Calendar.Schema.Event[],
  config: Config,
) {
  events?.filter((event) => event.colorId === config.targetColorId)
    .forEach((event) => {
      let sourceEvent: CalendarEvent | undefined;
      if (event.id) {
        try {
          sourceEvent = Calendar.Events?.get(config.sourceCalendarId, event.id);

          if (sourceEvent) {
            const updatedEvent = {
              ...sourceEvent,
              colorId: config.targetColorId,
            };
            console.log("update existing event");
            console.log(updatedEvent);
            Calendar.Events?.update(updatedEvent, config.targetCalendarId, event.id, { sendUpdates: 'none' }, { 'If-Match': event?.etag });
          }
          return;
        } catch (e) {
          console.log(e);
        }
      } else {
        // If the event does not have an ID, we cannot update or remove it.
        console.log("Event does not have an ID, skipping.");
      }
    });
}

function getConfig() {
  return {
    sourceCalendarId: ENV.SOURCE_CALENDAR_ID,
    targetCalendarId: ENV.TARGET_CALENDAR_ID,
    targetColorId: ENV.TARGET_COLOR_ID,
  };
}
