CREATE TABLE IF NOT EXISTS activities (
    activity_id SERIAL PRIMARY KEY,
    band_id INTEGER REFERENCES bands(band_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    action_text VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
