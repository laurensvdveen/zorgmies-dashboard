// Microsoft Graph API helpers for 3 ZorgMies locations
// Each location has its own Azure AD app registration (client credentials flow)

export type LocationId = "regiobar" | "capelle" | "nissewaard";

export interface LocationConfig {
  id: LocationId;
  label: string;
  shortLabel: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  userEmail: string;
  cssClass: string;
}

export const LOCATIONS: LocationConfig[] = [
  {
    id: "regiobar",
    label: "Regio Bar",
    shortLabel: "RB",
    tenantId: process.env.AZURE_TENANT_ID_REGIOBAR ?? "",
    clientId: process.env.AZURE_CLIENT_ID_REGIOBAR ?? "",
    clientSecret: process.env.AZURE_CLIENT_SECRET_REGIOBAR ?? "",
    userEmail: process.env.OUTLOOK_EMAIL_REGIOBAR ?? "",
    cssClass: "regiobar",
  },
  {
    id: "capelle",
    label: "Capelle & PA",
    shortLabel: "CA",
    tenantId: process.env.AZURE_TENANT_ID_CAPELLE ?? "",
    clientId: process.env.AZURE_CLIENT_ID_CAPELLE ?? "",
    clientSecret: process.env.AZURE_CLIENT_SECRET_CAPELLE ?? "",
    userEmail: process.env.OUTLOOK_EMAIL_CAPELLE ?? "",
    cssClass: "capelle",
  },
  {
    id: "nissewaard",
    label: "Nissewaard & HV",
    shortLabel: "NW",
    tenantId: process.env.AZURE_TENANT_ID_NISSEWAARD ?? "",
    clientId: process.env.AZURE_CLIENT_ID_NISSEWAARD ?? "",
    clientSecret: process.env.AZURE_CLIENT_SECRET_NISSEWAARD ?? "",
    userEmail: process.env.OUTLOOK_EMAIL_NISSEWAARD ?? "",
    cssClass: "nissewaard",
  },
];

// Token cache (in-memory, per cold start)
const tokenCache: Record<string, { token: string; expiresAt: number }> = {};

/**
 * Get an access token using client credentials flow
 */
async function getAccessToken(loc: LocationConfig): Promise<string> {
  const cacheKey = loc.id;
  const cached = tokenCache[cacheKey];
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const tokenUrl = `https://login.microsoftonline.com/${loc.tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: loc.clientId,
    client_secret: loc.clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token error for ${loc.label}: ${err}`);
  }

  const data = await res.json();
  tokenCache[cacheKey] = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Make an authenticated Graph API request
 */
async function graphRequest(
  loc: LocationConfig,
  path: string,
  params?: Record<string, string>
): Promise<unknown> {
  const token = await getAccessToken(loc);
  const url = new URL(`https://graph.microsoft.com/v1.0${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph API error (${loc.label}): ${res.status} ${err}`);
  }

  return res.json();
}

/**
 * Calendar events interface
 */
export interface CalendarEvent {
  id: string;
  subject: string;
  start: string;
  end: string;
  isAllDay: boolean;
  location: string;
  locationId: LocationId;
  locationLabel: string;
}

/**
 * Fetch calendar events for the coming 14 days for a location
 */
export async function fetchCalendarEvents(
  loc: LocationConfig
): Promise<CalendarEvent[]> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endDate = new Date(startOfToday);
  endDate.setDate(endDate.getDate() + 14);

  const startISO = startOfToday.toISOString();
  const endISO = endDate.toISOString();

  try {
    const data = (await graphRequest(
      loc,
      `/users/${loc.userEmail}/calendarView`,
      {
        startDateTime: startISO,
        endDateTime: endISO,
        $orderby: "start/dateTime",
        $top: "50",
        $select: "id,subject,start,end,isAllDay,location",
      }
    )) as { value: Array<Record<string, unknown>> };

    return data.value.map((evt) => ({
      id: evt.id as string,
      subject: evt.subject as string,
      start: (evt.start as { dateTime: string }).dateTime,
      end: (evt.end as { dateTime: string }).dateTime,
      isAllDay: evt.isAllDay as boolean,
      location: (evt.location as { displayName?: string })?.displayName ?? "",
      locationId: loc.id,
      locationLabel: loc.label,
    }));
  } catch (error) {
    console.error(`Calendar fetch error for ${loc.label}:`, error);
    return [];
  }
}

/**
 * Mail message interface
 */
export interface MailMessage {
  id: string;
  subject: string;
  from: string;
  receivedAt: string;
  isRead: boolean;
  preview: string;
  locationId: LocationId;
  locationLabel: string;
}

/**
 * Fetch recent inbox messages for a location
 */
export async function fetchMail(
  loc: LocationConfig
): Promise<{ messages: MailMessage[]; unreadCount: number }> {
  try {
    const data = (await graphRequest(
      loc,
      `/users/${loc.userEmail}/mailFolders/inbox/messages`,
      {
        $top: "10",
        $orderby: "receivedDateTime desc",
        $select: "id,subject,from,receivedDateTime,isRead,bodyPreview",
      }
    )) as { value: Array<Record<string, unknown>> };

    const messages: MailMessage[] = data.value.map((msg) => ({
      id: msg.id as string,
      subject: (msg.subject as string) ?? "(geen onderwerp)",
      from:
        (
          msg.from as {
            emailAddress?: { name?: string; address?: string };
          }
        )?.emailAddress?.name ?? "Onbekend",
      receivedAt: msg.receivedDateTime as string,
      isRead: msg.isRead as boolean,
      preview: ((msg.bodyPreview as string) ?? "").slice(0, 100),
      locationId: loc.id,
      locationLabel: loc.label,
    }));

    // Get unread count
    const folderData = (await graphRequest(
      loc,
      `/users/${loc.userEmail}/mailFolders/inbox`,
      { $select: "unreadItemCount" }
    )) as { unreadItemCount: number };

    return {
      messages,
      unreadCount: folderData.unreadItemCount ?? 0,
    };
  } catch (error) {
    console.error(`Mail fetch error for ${loc.label}:`, error);
    return { messages: [], unreadCount: 0 };
  }
}

/**
 * Fetch all locations' calendar events merged and sorted
 */
export async function fetchAllCalendarEvents(): Promise<CalendarEvent[]> {
  const results = await Promise.allSettled(
    LOCATIONS.map((loc) => fetchCalendarEvents(loc))
  );

  const allEvents: CalendarEvent[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allEvents.push(...result.value);
    }
  }

  return allEvents.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
}

/**
 * Fetch all locations' mail
 */
export async function fetchAllMail(): Promise<{
  messages: MailMessage[];
  unreadCounts: Record<LocationId, number>;
}> {
  const results = await Promise.allSettled(
    LOCATIONS.map((loc) => fetchMail(loc))
  );

  const allMessages: MailMessage[] = [];
  const unreadCounts: Record<LocationId, number> = {
    regiobar: 0,
    capelle: 0,
    nissewaard: 0,
  };

  LOCATIONS.forEach((loc, i) => {
    const result = results[i];
    if (result.status === "fulfilled") {
      allMessages.push(...result.value.messages);
      unreadCounts[loc.id] = result.value.unreadCount;
    }
  });

  allMessages.sort(
    (a, b) =>
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  );

  return { messages: allMessages, unreadCounts };
}
