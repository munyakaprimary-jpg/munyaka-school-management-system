import { Page } from "@playwright/test";

export const FIREBASE_MOCK_SCRIPT = `
(() => {
  if (window.__firebaseMockInstalled) return;
  window.__firebaseMockInstalled = true;

  const mockApp = { name: "[DEFAULT]", options: {} };
  const mockAuth = { currentUser: { uid: "test-admin-uid", email: "admin@munyaka.edu" } };

  const memoryStore = new Map();

  class MockDocumentReference {
    constructor(db, path) {
      this.db = db;
      this.path = path;
    }
    get id() {
      const parts = this.path.split("/");
      return parts[parts.length - 1];
    }
  }

  class MockCollectionReference {
    constructor(db, path) {
      this.db = db;
      this.path = path;
    }
    doc(id) {
      const docId = id || "doc_" + Math.random().toString(36).substring(2, 9);
      return new MockDocumentReference(this.db, this.path + "/" + docId);
    }
  }

  class MockQuerySnapshot {
    constructor(docs) {
      this.docs = docs;
      this.size = docs.length;
      this.empty = docs.length === 0;
    }
    forEach(callback) {
      this.docs.forEach(callback);
    }
  }

  class MockDocumentSnapshot {
    constructor(id, dataVal) {
      this.id = id;
      this._data = dataVal;
      this.exists = dataVal !== undefined && dataVal !== null;
    }
    data() {
      return this._data;
    }
  }

  const mockFirestore = {
    _store: memoryStore
  };

  window.__mockFirestoreStore = memoryStore;
})();
`;

export async function installFirebaseMocks(page: Page) {
  // Intercept any requests to firebase chunks or CDNs / firestore APIs
  await page.route("**/firebase_*.js", async (route) => {
    const url = route.request().url();
    // Return self-contained ESM stubs for Firebase modules
    if (url.includes("firebase_app")) {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: `
          export function initializeApp(options, name) { return { name: name || "[DEFAULT]", options: options || {} }; }
          export function getApps() { return [{ name: "[DEFAULT]", options: {} }]; }
          export function getApp(name) { return { name: name || "[DEFAULT]", options: {} }; }
        `
      });
    } else if (url.includes("firebase_auth")) {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: `
          export function getAuth(app) { return { currentUser: { uid: "test-admin-uid", email: "admin@munyaka.edu" } }; }
          export function sendPasswordResetEmail(auth, email) { return Promise.resolve(); }
          export function signOut(auth) { return Promise.resolve(); }
          export function signInAnonymously(auth) { return Promise.resolve({ user: { uid: "anon" } }); }
        `
      });
    } else if (url.includes("firebase_firestore")) {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: `
          const store = window.__mockFirestoreStore || new Map();
          
          export function getFirestore(app) { return { _store: store }; }
          
          export function collection(db, ...pathSegments) {
            const path = pathSegments.join("/");
            return {
              path,
              doc(id) {
                const docId = id || "doc_" + Math.random().toString(36).substring(2, 9);
                return { id: docId, path: path + "/" + docId };
              }
            };
          }
          
          export function doc(db, ...pathSegments) {
            const path = pathSegments.join("/");
            const parts = path.split("/");
            return { id: parts[parts.length - 1], path };
          }
          
          export function setDoc(docRef, data, options) {
            store.set(docRef.path, { ...data, updatedAt: new Date().toISOString() });
            return Promise.resolve();
          }
          
          export function updateDoc(docRef, data) {
            const existing = store.get(docRef.path) || {};
            store.set(docRef.path, { ...existing, ...data, updatedAt: new Date().toISOString() });
            return Promise.resolve();
          }
          
          export function deleteDoc(docRef) {
            store.delete(docRef.path);
            return Promise.resolve();
          }
          
          export function getDoc(docRef) {
            const val = store.get(docRef.path);
            return Promise.resolve({
              id: docRef.id,
              exists: () => val !== undefined,
              data: () => val
            });
          }
          
          export function getDocs(queryOrColl) {
            const prefix = queryOrColl.path;
            const matchedDocs = [];
            for (const [key, val] of store.entries()) {
              if (key.startsWith(prefix + "/")) {
                const parts = key.split("/");
                if (parts.length === prefix.split("/").length + 1) {
                  const id = parts[parts.length - 1];
                  matchedDocs.push({
                    id,
                    exists: true,
                    data: () => val,
                    id
                  });
                }
              }
            }
            return Promise.resolve({
              docs: matchedDocs,
              size: matchedDocs.length,
              empty: matchedDocs.length === 0,
              forEach(cb) { matchedDocs.forEach(cb); }
            });
          }

          export function writeBatch(db) {
            const ops = [];
            return {
              set(docRef, data, options) {
                ops.push(() => store.set(docRef.path, { ...data, updatedAt: new Date().toISOString() }));
                return this;
              },
              update(docRef, data) {
                ops.push(() => {
                  const existing = store.get(docRef.path) || {};
                  store.set(docRef.path, { ...existing, ...data, updatedAt: new Date().toISOString() });
                });
                return this;
              },
              delete(docRef) {
                ops.push(() => store.delete(docRef.path));
                return this;
              },
              commit() {
                ops.forEach(op => op());
                return Promise.resolve();
              }
            };
          }
        `
      });
    } else {
      await route.continue();
    }
  });

  // Also block real firestore network requests if any slip through
  await page.route("**/firestore.googleapis.com/**", route => route.abort());
}
