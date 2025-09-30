"use client";

import type { PhraseRow } from "@/lib/history";
import { openDB, tx } from "./idb";

const DB_NAME = "fratabi";
const DB_VERSION = 1;
const STORE = "favorites";

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, (db) => {
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE, { keyPath: "id" });
    }
  });
}

export async function fav_getAll(): Promise<PhraseRow[]> {
  const db = await getDB();
  return tx(db, STORE, "readonly", (store) => {
    return new Promise<PhraseRow[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result ?? []) as PhraseRow[]);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function fav_get(id: string): Promise<PhraseRow | undefined> {
  const db = await getDB();
  return tx(db, STORE, "readonly", (store) => {
    return new Promise<PhraseRow | undefined>((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as PhraseRow | undefined);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function fav_upsert(card: PhraseRow) {
  const db = await getDB();
  await tx(db, STORE, "readwrite", (store) => {
    store.put(card);
  });
}

export async function fav_bulkUpsert(cards: PhraseRow[]) {
  const db = await getDB();
  await tx(db, STORE, "readwrite", (store) => {
    for (const c of cards) store.put(c);
  });
}

export async function fav_remove(id: string) {
  const db = await getDB();
  await tx(db, STORE, "readwrite", (store) => {
    store.delete(id);
  });
}

