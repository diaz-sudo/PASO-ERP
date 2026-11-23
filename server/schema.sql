PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','seller','warehouse')),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY, sku TEXT NOT NULL UNIQUE COLLATE NOCASE,
  brand TEXT NOT NULL, model TEXT NOT NULL, category TEXT NOT NULL,
  size TEXT NOT NULL, color TEXT NOT NULL,
  cost INTEGER NOT NULL CHECK(cost >= 0), price INTEGER NOT NULL CHECK(price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0), min_stock INTEGER NOT NULL DEFAULT 5 CHECK(min_stock >= 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, document TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, document TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cash_sessions (
  id INTEGER PRIMARY KEY, opened_by INTEGER NOT NULL REFERENCES users(id), opened_at TEXT NOT NULL,
  opening_amount INTEGER NOT NULL CHECK(opening_amount >= 0), closed_by INTEGER REFERENCES users(id),
  closed_at TEXT, counted_amount INTEGER CHECK(counted_amount >= 0), expected_amount INTEGER, difference INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS only_one_open_cash ON cash_sessions((1)) WHERE closed_at IS NULL;
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY, supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  user_id INTEGER NOT NULL REFERENCES users(id), status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','received')),
  total INTEGER NOT NULL CHECK(total > 0), note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL, received_at TEXT
);
CREATE TABLE IF NOT EXISTS purchase_items (
  id INTEGER PRIMARY KEY, purchase_id INTEGER NOT NULL REFERENCES purchases(id), product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK(quantity > 0), unit_cost INTEGER NOT NULL CHECK(unit_cost >= 0)
);
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id), user_id INTEGER NOT NULL REFERENCES users(id),
  cash_session_id INTEGER NOT NULL REFERENCES cash_sessions(id),
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','card','transfer')),
  total INTEGER NOT NULL CHECK(total > 0), request_id TEXT UNIQUE, request_hash TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY, sale_id INTEGER NOT NULL REFERENCES sales(id), product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK(quantity > 0), unit_price INTEGER NOT NULL CHECK(unit_price >= 0),
  unit_cost INTEGER NOT NULL CHECK(unit_cost >= 0)
);
CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id),
  user_id INTEGER NOT NULL REFERENCES users(id), type TEXT NOT NULL CHECK(type IN ('initial','sale','purchase','adjustment')),
  quantity INTEGER NOT NULL CHECK(quantity != 0), reason TEXT NOT NULL,
  sale_id INTEGER REFERENCES sales(id), purchase_id INTEGER REFERENCES purchases(id), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cash_movements (
  id INTEGER PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES cash_sessions(id),
  user_id INTEGER NOT NULL REFERENCES users(id), type TEXT NOT NULL CHECK(type IN ('sale','income','expense')),
  amount INTEGER NOT NULL CHECK(amount > 0), reason TEXT NOT NULL, sale_id INTEGER UNIQUE REFERENCES sales(id), created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sales_by_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS stock_by_product ON stock_movements(product_id, created_at);
CREATE INDEX IF NOT EXISTS cash_by_session ON cash_movements(session_id);
