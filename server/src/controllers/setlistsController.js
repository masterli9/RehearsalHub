import pool from "../db/pool.js";

// Fetch all setlists for a band
export const getSetlists = async (req, res) => {
	const { bandId } = req.params;

	if (!bandId) {
		return res.status(400).json({ error: "Band ID is required" });
	}

	try {
		const result = await pool.query(
			"SELECT setlist_id, title, created_at FROM setlists WHERE band_id = $1 ORDER BY created_at DESC",
			[bandId],
		);
		res.json(result.rows);
	} catch (error) {
		console.error("Error fetching setlists:", error);
		res.status(500).json({ error: "Error fetching setlists" });
	}
};

// Fetch a single setlist and its songs
export const getSetlistDetails = async (req, res) => {
	const { id } = req.params;

	try {
		// Get the setlist metadata
		const setlistResult = await pool.query(
			"SELECT setlist_id, title, created_at, band_id FROM setlists WHERE setlist_id = $1",
			[id],
		);

		if (setlistResult.rows.length === 0) {
			return res.status(404).json({ error: "Setlist not found" });
		}

		const setlist = setlistResult.rows[0];

		// Get the songs ordered by position
		const songsResult = await pool.query(
			`SELECT s.song_id, s.title, s.key, s.length, s.status, s.bpm, ss.position
             FROM setlists_songs ss
             JOIN songs s ON ss.song_id = s.song_id
             WHERE ss.setlist_id = $1
             ORDER BY ss.position ASC`,
			[id],
		);

		res.json({
			...setlist,
			songs: songsResult.rows,
		});
	} catch (error) {
		console.error("Error fetching setlist details:", error);
		res.status(500).json({ error: "Error fetching setlist details" });
	}
};

// Create a new setlist
export const createSetlist = async (req, res) => {
	const { title, bandId, songs } = req.body;

	if (!title || !bandId) {
		return res
			.status(400)
			.json({ error: "Title and Band ID are required" });
	}

	try {
		await pool.query("BEGIN");

		// Insert setlist
		const setlistResult = await pool.query(
			"INSERT INTO setlists (title, band_id) VALUES ($1, $2) RETURNING setlist_id, title, created_at",
			[title, bandId],
		);

		const newSetlist = setlistResult.rows[0];

		// Insert songs if provided
		if (songs && Array.isArray(songs) && songs.length > 0) {
			for (let i = 0; i < songs.length; i++) {
				const song = songs[i];
				await pool.query(
					"INSERT INTO setlists_songs (setlist_id, song_id, position) VALUES ($1, $2, $3)",
					[newSetlist.setlist_id, song.song_id, i + 1],
				);
			}
		}

		await pool.query("COMMIT");
		res.status(201).json(newSetlist);
	} catch (error) {
		await pool.query("ROLLBACK");
		console.error("Error creating setlist:", error);
		res.status(500).json({ error: "Error creating setlist" });
	}
};

// Update an existing setlist
export const updateSetlist = async (req, res) => {
	const { id } = req.params;
	const { title, songs } = req.body;

	if (!title) {
		return res.status(400).json({ error: "Title is required" });
	}

	try {
		await pool.query("BEGIN");

		// Update setlist title
		const setlistResult = await pool.query(
			"UPDATE setlists SET title = $1 WHERE setlist_id = $2 RETURNING setlist_id, title, created_at",
			[title, id],
		);

		if (setlistResult.rows.length === 0) {
			await pool.query("ROLLBACK");
			return res.status(404).json({ error: "Setlist not found" });
		}

		// Delete existing song mappings
		await pool.query("DELETE FROM setlists_songs WHERE setlist_id = $1", [
			id,
		]);

		// Insert new song mappings
		if (songs && Array.isArray(songs) && songs.length > 0) {
			for (let i = 0; i < songs.length; i++) {
				const song = songs[i];
				await pool.query(
					"INSERT INTO setlists_songs (setlist_id, song_id, position) VALUES ($1, $2, $3)",
					[id, song.song_id, i + 1],
				);
			}
		}

		await pool.query("COMMIT");
		res.json(setlistResult.rows[0]);
	} catch (error) {
		await pool.query("ROLLBACK");
		console.error("Error updating setlist:", error);
		res.status(500).json({ error: "Error updating setlist" });
	}
};

// Delete a setlist
export const deleteSetlist = async (req, res) => {
	const { id } = req.params;

	try {
		const result = await pool.query(
			"DELETE FROM setlists WHERE setlist_id = $1 RETURNING setlist_id",
			[id],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Setlist not found" });
		}

		res.json({
			message: "Setlist deleted successfully",
			setlist_id: result.rows[0].setlist_id,
		});
	} catch (error) {
		console.error("Error deleting setlist:", error);
		res.status(500).json({ error: "Error deleting setlist" });
	}
};
