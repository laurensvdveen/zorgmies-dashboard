// Microsoft Graph API helpers for 3 ZorgMies locations
// Delegated flow: authorization code + refresh tokens stored in Vercel KV

import { kv } from "@vercel/kv";

export type LocationId = "regiobar" | "capelle" | "nissewaard";

export interface LocationConfig {
  id: LocationId;
  label: string;
  shortLabel: string;
  cssClass: string;
}

export const LOCATIONS: LocationConfig[] = [
  {
    id: "regiobar",
    label: "Regio Bar",
    shortLabel: "RB",
    cssClass: "regiobar",
  },
  {
    id: "capelle",
    label: "Capelle & PA",
    shortLabel: "CA",
    cssClass: "capelle",
  },
  {
    id: "nissewaard",
    label: "Nissewaard & HV",
    shortLabel: "NW",
    cssClass: "nissewaard",
  },
];

// --- Token management ---

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  userEmail: string;
  userName: string;
  connectedAt: string;
}

const TENANT_ID = process.env.AZURE_TENANT_ID ?? "";
const CLIENT_ID = process.env.AZURE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET ?? "";

/**
 * Get a valid access token for a location.
 * If the stored token is expired, refreshes it automatically.
 * Returns null if the location is not connected.
 */
async function getAccessToken(locationId: LocationId): Promise<string | null> {
  const kvKey = `zorgmies:outlook:${locationId}:tokens`;
  const stored = await kv.get<StoredTokens>(kvKey);

  if (!stored) {
    return null; // Location not connected
  }

  // If token is still valid (with 2-minute buffer), use it
  if (stored.expiresAt > Date.now() + 120_000) {
    return stored.accessToken;
  }

  // Token expired — refresh it
  try {
    const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: stored.refreshToken,
      grant_type: "refresh_token",
      scope:
        "openid profile email offline_access Mail.Read Calendars.Read User.Read",
    });

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Token refresh failed for ${locationId}:`, err);
      // If refresh token is revoked, remove stored tokens
      if (res.status === 400 || res.status === 401) {
        await kv.del(kvKey);
      }
      return null;
    }

    const data = await res.json();

    // Update stored tokens (refresh token may rotate)
    const updatedTokens: StoredTokens = {
      ...stored,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? stored.refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    await kv.set(kvKey, updatedTokens);
    return data.access_token;
  } catch (error) {
    console.error(`Token refresh error for ${locationId}:`, error);
    return null;
  }
}

/**
 * Make an authenticated Graph API request using delegated permissions.
 * With delegated flow, we use /me/... instead of /users/{email}/...
 */
async function graphRequest(
  locationId: LocationId,
  path: string,
  params?: Record<string, string>
): Promise<unknown> {
  const token = await getAccessToken(locationId);

  if (!token) {
    throw new Error(`Niet gekoppeld: ${locationId}`);
  }

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
    throw new Error(`Graph API error (${locationId}): ${res.status} ${err}`);
  }

  return res.json();
}

/**
 * Check if a location is connected (has valid tokens)
 */
export async function isLocationConnected(
  locationId: LocationId
): Promise<boolean> {
  const stored = await kv.get<StoredTokens>(
    `zorgmies:outlook:${locationId}:tokens`
  );
  return stored !== null;
}

// --- Calendar ---

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
 * Fetch calendar events for the coming 14 days for a location.
 * Uses /me/calendarView (delegated).
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
    const data = (await graphRequest(loc.id, `/me/calendarView`, {
      startDateTime: startISO,
      endDateTime: endISO,
      $orderby: "start/dateTime",
      $top: "50",
      $select: "id,subject,start,end,isAllDay,location",
    })) as { value: Array<Record<string, unknown>> };

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

// --- Mail ---

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
 * Fetch recent inbox messages for a location.
 * Uses /me/mailFolders/inbox/messages (delegated).
 */
export async function fetchMail(
  loc: LocationConfig
): Promise<{ messages: MailMessage[]; unreadCount: number }> {
  try {
    const data = (await graphRequest(
      loc.id,
      `/me/mailFolders/inbox/messages`,
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
      loc.id,
      `/me/mailFolders/inbox`,
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

// --- Aggregated fetchers ---

/**
 * Fetch all connected locations' calendar events merged and sorted
 */
export async function fetchAllCalendarEvents(): Promise<CalendarEvent[]> {
  // Only fetch for connected locations
  const connectedLocations: LocationConfig[] = [];
  for (const loc of LOCATIONS) {
    if (await isLocationConnected(loc.id)) {
      connectedLocations.push(loc);
    }
  }

  if (connectedLocations.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    connectedLocations.map((loc) => fetchCalendarEvents(loc))
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
 * Fetch all connected locations' mail
 */
export async function fetchAllMail(): Promise<{
  messages: MailMessage[];
  unreadCounts: Record<LocationId, number>;
}> {
  const allMessages: MailMessage[] = [];
  const unreadCounts: Record<LocationId, number> = {
    regiobar: 0,
    capelle: 0,
    nissewaard: 0,
  };

  // Only fetch for connected locations
  const connectedLocations: LocationConfig[] = [];
  for (const loc of LOCATIONS) {
    if (await isLocationConnected(loc.id)) {
      connectedLocations.push(loc);
    }
  }

  if (connectedLocations.length === 0) {
    return { messages: allMessages, unreadCounts };
  }

  const results = await Promise.allSettled(
    connectedLocations.map((loc) => fetchMail(loc))
  );

  connectedLocations.forEach((loc, i) => {
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
