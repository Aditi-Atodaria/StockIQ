"""
Database initialization and connection management.
Uses SQLite for MVP (swap connection string for PostgreSQL in production).
"""

import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent / "stock_intelligence.db"


def get_connection():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create all tables if they don't exist."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS stocks (
            symbol      TEXT PRIMARY KEY,
            name        TEXT,
            exchange    TEXT,
            sector      TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS price_data (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol      TEXT NOT NULL,
            timestamp   TIMESTAMP NOT NULL,
            open        REAL,
            high        REAL,
            low         REAL,
            close       REAL,
            volume      INTEGER,
            UNIQUE(symbol, timestamp)
        );

        CREATE TABLE IF NOT EXISTS regime_snapshots (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol          TEXT NOT NULL,
            timestamp       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            regime          TEXT,
            confidence      REAL,
            adx             REAL,
            atr             REAL,
            rsi             REAL,
            bb_width        REAL,
            strategy_code   TEXT,
            strategy_name   TEXT,
            strategy_reason TEXT
        );

        CREATE TABLE IF NOT EXISTS news_articles (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol          TEXT NOT NULL,
            title           TEXT,
            source          TEXT,
            url             TEXT,
            published_at    TIMESTAMP,
            sentiment       TEXT,
            sentiment_score REAL
        );
    """)

    conn.commit()
    conn.close()
    print("✅ Database initialized.")
