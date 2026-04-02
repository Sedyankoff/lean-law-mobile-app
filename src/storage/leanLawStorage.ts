import * as SQLite from 'expo-sqlite';
import type { FoodEntry, MacroTargets } from '../types/macros';

const DB_NAME = 'leanlaw.db';
const TARGETS_TABLE = 'targets';
const FOODS_TABLE = 'foods';

let dbPromise: Promise<any> | null = null;

async function getDb(): Promise<any> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);

      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS ${TARGETS_TABLE} (
          id INTEGER PRIMARY KEY NOT NULL,
          calories REAL NOT NULL,
          protein REAL NOT NULL,
          carbs REAL NOT NULL,
          fats REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ${FOODS_TABLE} (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          calories REAL NOT NULL,
          protein REAL NOT NULL,
          carbs REAL NOT NULL,
          fats REAL NOT NULL,
          createdAt TEXT NOT NULL
        );
      `);

      return db;
    })();
  }

  return dbPromise;
}

export async function loadTargets(): Promise<MacroTargets | null> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT calories, protein, carbs, fats FROM ${TARGETS_TABLE} WHERE id = 1;`
  );

  if (!rows || rows.length === 0) return null;

  const row = rows[0] as any;
  return {
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fats: row.fats,
  };
}

export async function saveTargets(targets: MacroTargets): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO ${TARGETS_TABLE} (id, calories, protein, carbs, fats)
     VALUES (1, ?, ?, ?, ?);`,
    targets.calories,
    targets.protein,
    targets.carbs,
    targets.fats
  );
}

export async function loadFoods(): Promise<FoodEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT id, name, calories, protein, carbs, fats, createdAt
     FROM ${FOODS_TABLE}
     ORDER BY datetime(createdAt) DESC;`
  );

  if (!rows) return [];
  return (rows as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fats: r.fats,
    createdAt: r.createdAt,
  }));
}

/**
 * За нашия малък app – трием всичко и записваме наново.
 */
export async function saveFoods(foods: FoodEntry[]): Promise<void> {
  const db = await getDb();

  await db.runAsync(`DELETE FROM ${FOODS_TABLE};`);

  for (const f of foods) {
    await db.runAsync(
      `INSERT INTO ${FOODS_TABLE}
       (id, name, calories, protein, carbs, fats, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      f.id,
      f.name,
      f.calories,
      f.protein,
      f.carbs,
      f.fats,
      f.createdAt
    );
  }
}

export async function clearDay(): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM ${FOODS_TABLE};`);
  await db.runAsync(`DELETE FROM ${TARGETS_TABLE};`);
}