import pool from "../db/pool.js";

export const getTasks = async (req, res) => {
	const { bandId } = req.query;

	const bandIdInt = parseInt(bandId, 10);
	if (isNaN(bandIdInt) || bandIdInt <= 0) {
		return res.status(400).json({
			error: "A valid bandId is required and must be a positive integer.",
		});
	}

	try {
		const query = `
			SELECT 
				t.task_id, t.title, t.description, t.due_date, t.band_member_id, t.assigned_by, t.status,
				u1.username as assignee_username, u1.photourl as assignee_photo,
				u2.username as assigner_username, u2.photourl as assigner_photo
			FROM tasks t
			JOIN band_members bm ON t.band_member_id = bm.band_member_id
			JOIN users u1 ON bm.user_id = u1.user_id
			LEFT JOIN band_members creator ON t.assigned_by = creator.band_member_id
			LEFT JOIN users u2 ON creator.user_id = u2.user_id
			WHERE bm.band_id = $1
			ORDER BY t.due_date ASC NULLS LAST, t.task_id DESC
		`;
		
		const result = await pool.query(query, [bandIdInt]);
		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching tasks: ", error);
		res.status(500).json({ error: "Server error (get tasks)" });
	}
};

export const createTask = async (req, res) => {
	try {
		let { title, description, due_date, band_member_id, assigned_by } = req.body;

		if (!title || typeof title !== "string") {
			return res.status(400).json({ error: "Title is required" });
		}
		if (!band_member_id) {
			return res.status(400).json({ error: "Assignee (band_member_id) is required" });
		}

		title = title.trim();
		if (description) description = description.trim();
		
		let dueDateValue = null;
		if (due_date) {
			dueDateValue = new Date(due_date);
			if (isNaN(dueDateValue.getTime())) {
				dueDateValue = null;
			}
		}

		const query = `
			INSERT INTO tasks (title, description, due_date, band_member_id, assigned_by, status)
			VALUES ($1, $2, $3, $4, $5, 'pending')
			RETURNING *
		`;
		
		const result = await pool.query(query, [
			title, 
			description || null, 
			dueDateValue, 
			parseInt(band_member_id, 10), 
			assigned_by ? parseInt(assigned_by, 10) : null
		]);

		res.status(201).json(result.rows[0]);
	} catch (error) {
		console.error("Error creating task: ", error);
		res.status(500).json({ error: "Server error (create task)" });
	}
};

export const updateTask = async (req, res) => {
	const { id } = req.params;
	try {
		let { title, description, due_date, status, requesting_member_id } = req.body;

		if (!requesting_member_id) {
			return res.status(403).json({ error: "requesting_member_id is required for authorization" });
		}

		const taskQuery = `
			SELECT t.band_member_id, t.assigned_by
			FROM tasks t
			WHERE t.task_id = $1
		`;
		const taskResult = await pool.query(taskQuery, [id]);
		if (taskResult.rows.length === 0) {
			return res.status(404).json({ error: "Task not found" });
		}

		const task = taskResult.rows[0];
		const reqMemberIdInt = parseInt(requesting_member_id, 10);
		const isAssignee = task.band_member_id === reqMemberIdInt;
		const isAssigner = task.assigned_by === reqMemberIdInt;

		let isLeader = false;
		if (!isAssignee && !isAssigner) {
			const leaderQuery = `
				SELECT 1 FROM member_roles mr
				JOIN roles r ON mr.role_id = r.role_id
				WHERE mr.band_member_id = $1 AND r.title = 'Leader'
			`;
			const leaderResult = await pool.query(leaderQuery, [reqMemberIdInt]);
			isLeader = leaderResult.rows.length > 0;
		}

		if (!isAssignee && !isAssigner && !isLeader) {
			return res.status(403).json({ error: "You do not have permission to modify this task" });
		}

		let dueDateValue = undefined;
		if (due_date !== undefined) {
			if (due_date === null) {
				dueDateValue = null;
			} else {
				dueDateValue = new Date(due_date);
				if (isNaN(dueDateValue.getTime())) {
					dueDateValue = null;
				}
			}
		}

		// Simple dynamic update build
		const updates = [];
		const values = [];
		let paramIndex = 1;

		if (title !== undefined) {
			updates.push(`title = $${paramIndex++}`);
			values.push(title.trim());
		}
		if (description !== undefined) {
			updates.push(`description = $${paramIndex++}`);
			values.push(description ? description.trim() : null);
		}
		if (dueDateValue !== undefined) {
			updates.push(`due_date = $${paramIndex++}`);
			values.push(dueDateValue);
		}
		if (status !== undefined) {
			updates.push(`status = $${paramIndex++}`);
			values.push(status);
		}

		if (updates.length === 0) {
			return res.status(400).json({ error: "No fields to update" });
		}

		values.push(id);
		const query = `
			UPDATE tasks 
			SET ${updates.join(", ")}
			WHERE task_id = $${paramIndex}
			RETURNING *
		`;

		const result = await pool.query(query, values);
		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Task not found" });
		}

		res.status(200).json(result.rows[0]);
	} catch (error) {
		console.error("Error updating task: ", error);
		res.status(500).json({ error: "Server error (update task)" });
	}
};

export const deleteTask = async (req, res) => {
	const { id } = req.params;
	const { requesting_member_id } = req.query;

	try {
		if (!requesting_member_id) {
			return res.status(403).json({ error: "requesting_member_id is required for authorization" });
		}

		const taskQuery = `
			SELECT t.band_member_id, t.assigned_by
			FROM tasks t
			WHERE t.task_id = $1
		`;
		const taskResult = await pool.query(taskQuery, [id]);
		if (taskResult.rows.length === 0) {
			return res.status(404).json({ error: "Task not found" });
		}

		const task = taskResult.rows[0];
		const reqMemberIdInt = parseInt(requesting_member_id, 10);
		const isAssignee = task.band_member_id === reqMemberIdInt;
		const isAssigner = task.assigned_by === reqMemberIdInt;

		let isLeader = false;
		if (!isAssignee && !isAssigner) {
			const leaderQuery = `
				SELECT 1 FROM member_roles mr
				JOIN roles r ON mr.role_id = r.role_id
				WHERE mr.band_member_id = $1 AND r.title = 'Leader'
			`;
			const leaderResult = await pool.query(leaderQuery, [reqMemberIdInt]);
			isLeader = leaderResult.rows.length > 0;
		}

		if (!isAssignee && !isAssigner && !isLeader) {
			return res.status(403).json({ error: "You do not have permission to delete this task" });
		}

		const result = await pool.query(
			"DELETE FROM tasks WHERE task_id = $1 RETURNING *",
			[id]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Task not found" });
		}

		res.status(200).json({ message: "Task deleted successfully" });
	} catch (error) {
		console.error("Error deleting task: ", error);
		res.status(500).json({ error: "Server error (delete task)" });
	}
};
