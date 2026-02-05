create table song_files (
	file_id SERIAL,
	song_id INT,
	filename VARCHAR(255),
	storage_path TEXT,
	created_at TIMESTAMPTZ DEFAULT NOW()
);

alter table song_files add foreign key (song_id) references Songs(song_id);