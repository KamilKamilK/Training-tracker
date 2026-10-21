// After a reload, or a navigation in a context that already ran the app, Firestore can wait up to
// about 9 s for the previous page's IndexedDB tab lease to expire before it reads data (ADR-0010,
// pkt 3). The first check after such a load gets that long; later checks keep the default limit.
export const AFTER_RELOAD = { timeout: 15_000 };
