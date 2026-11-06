// Append-only. Never edit a migration that has shipped — add a new one.
export const MIGRATIONS: Array<{ version: number; sql: string }> = [
  {
    version: 1,
    sql: `
      CREATE TABLE items (
        id                  text PRIMARY KEY,
        name                text NOT NULL,
        category            text NOT NULL,
        primary_color       text NOT NULL DEFAULT '',
        secondary_color     text NOT NULL DEFAULT '',
        pattern             text NOT NULL DEFAULT '',
        formality           text NOT NULL DEFAULT '',
        season              text NOT NULL DEFAULT '',
        material            text,
        fit                 text,
        length              text,
        accessory_type      text,
        image_key           text,
        thumb_key           text,
        image_filename      text NOT NULL DEFAULT '',
        added_at            double precision NOT NULL,
        price               double precision,
        wear_count          int NOT NULL DEFAULT 0,
        rec_count           int NOT NULL DEFAULT 0,
        last_recommended_at double precision,
        style_note          text,
        visual_notes        text,
        attributes          jsonb NOT NULL DEFAULT '{}'::jsonb,
        salience            jsonb NOT NULL DEFAULT '{}'::jsonb
      );

      CREATE TABLE settings (
        key        text PRIMARY KEY,
        value      text NOT NULL,
        updated_at double precision NOT NULL
      );

      CREATE TABLE looks (
        id              text PRIMARY KEY,
        title           text NOT NULL,
        item_ids        text[] NOT NULL DEFAULT '{}',
        style_reference text,
        rationale       text,
        accessorizing   jsonb,
        saved_at        double precision NOT NULL,
        feedback        text
      );

      CREATE TABLE journal (
        id            text PRIMARY KEY,
        date          text NOT NULL,
        item_ids      text[] NOT NULL DEFAULT '{}',
        occasion      text,
        weather_note  text,
        saved_look_id text,
        logged_at     double precision NOT NULL
      );

      CREATE TABLE usage_log (
        id                    bigserial PRIMARY KEY,
        ts                    double precision NOT NULL,
        route                 text NOT NULL,
        model                 text NOT NULL,
        input_tokens          int NOT NULL DEFAULT 0,
        output_tokens         int NOT NULL DEFAULT 0,
        cache_creation_tokens int NOT NULL DEFAULT 0,
        cache_read_tokens     int NOT NULL DEFAULT 0,
        cost_usd              double precision NOT NULL DEFAULT 0,
        latency_ms            int
      );
      CREATE INDEX usage_log_ts_idx ON usage_log (ts);

      CREATE TABLE backups (
        id         bigserial PRIMARY KEY,
        created_at double precision NOT NULL,
        media_key  text NOT NULL,
        item_count int NOT NULL
      )
    `,
  },
];
