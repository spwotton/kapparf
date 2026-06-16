---
name: Google Drive integration — getClient() returns empty
description: The installed google-drive connector's getClient() yields an empty object; call the Drive REST API directly with the access token instead.
---

The Replit Google Drive integration's `getClient()` returns an empty object at
runtime — it does NOT hand back a usable Drive SDK client.

**Why:** observed runtime behavior of the connector in this repo; code that
relies on the object returned by getClient() silently no-ops.

**How to apply:** when you need Drive access, read the access token from the
connection settings and make direct REST calls to the Google Drive API
(`https://www.googleapis.com/drive/v3/...`) with an `Authorization: Bearer <token>`
header, rather than expecting an SDK object from getClient().
