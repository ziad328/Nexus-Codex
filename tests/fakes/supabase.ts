import { vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';

type Row = Record<string, unknown>;
type Operation = 'select' | 'insert' | 'delete';
type AuthListener = (event: string, session: Session | null) => void;

export interface RecordedQuery {
  table: string;
  operation: Operation;
  rows: Row[];
  filters: [string, unknown][];
}

let tables: Record<string, Row[]> = {};
let failures = new Map<string, string>();
let queries: RecordedQuery[] = [];
let listeners = new Set<AuthListener>();
let currentSession: Session | null = null;

const run = (query: RecordedQuery) => {
  queries.push(query);
  const failureKey = `${query.table}.${query.operation}`;
  const message = failures.get(failureKey);
  if (message) {
    failures.delete(failureKey);
    return { data: null, error: { message } };
  }

  const rows = (tables[query.table] ??= []);
  const matches = (row: Row) => query.filters.every(([column, value]) => row[column] === value);

  if (query.operation === 'insert') rows.push(...query.rows);
  if (query.operation === 'delete') tables[query.table] = rows.filter((row) => !matches(row));
  return { data: query.operation === 'select' ? rows.filter(matches) : null, error: null };
};

const from = (table: string) => {
  const query: RecordedQuery = { table, operation: 'select', rows: [], filters: [] };
  const builder = {
    select: () => builder,
    insert: (rows: Row | Row[]) => {
      query.operation = 'insert';
      query.rows = Array.isArray(rows) ? rows : [rows];
      return builder;
    },
    delete: () => {
      query.operation = 'delete';
      return builder;
    },
    eq: (column: string, value: unknown) => {
      query.filters.push([column, value]);
      return builder;
    },
    then: <T>(onDone: (result: ReturnType<typeof run>) => T) => Promise.resolve(run(query)).then(onDone),
  };
  return builder;
};

/** Stands in for the client from `src/utils/supabase`. Like the real one, it reports failures in `error`. */
export const supabase = {
  from,
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithOtp: vi.fn(),
    signOut: vi.fn(),
  },
};

/** Controls and inspects the fake from a test. */
export const supabaseFake = {
  seed: (table: string, rows: Row[]) => { tables[table] = [...rows]; },
  rows: (table: string) => tables[table] ?? [],
  queries: () => queries,
  /** Makes the next matching query return this error, once. */
  failNext: (table: string, operation: Operation, message = 'Database error') => {
    failures.set(`${table}.${operation}`, message);
  },
  setSession: (session: Session | null) => { currentSession = session; },
  emitAuth: (event: string, session: Session | null) => {
    currentSession = session;
    listeners.forEach((listener) => listener(event, session));
  },
  reset: () => {
    tables = {};
    failures = new Map();
    queries = [];
    listeners = new Set();
    currentSession = null;
    supabase.auth.getSession.mockReset().mockImplementation(async () => ({
      data: { session: currentSession },
      error: null,
    }));
    supabase.auth.onAuthStateChange.mockReset().mockImplementation((listener: AuthListener) => {
      listeners.add(listener);
      return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
    });
    supabase.auth.signInWithOtp.mockReset().mockResolvedValue({ data: {}, error: null });
    supabase.auth.signOut.mockReset().mockResolvedValue({ error: null });
  },
};
