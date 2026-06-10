CREATE TABLE users (
	id INTEGER NOT NULL, 
	nom VARCHAR(100) NOT NULL, 
	prenom VARCHAR(100) NOT NULL, 
	email VARCHAR NOT NULL, 
	phone VARCHAR(10) NOT NULL, 
	bio VARCHAR, 
	password_hash VARCHAR NOT NULL, 
	passphrase_hash VARCHAR NOT NULL, 
	passphrase_question VARCHAR, 
	filiere VARCHAR(2), 
	level VARCHAR(2), 
	img_path VARCHAR, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id)
);
CREATE UNIQUE INDEX ix_users_phone ON users (phone);
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE TABLE user_skills (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	competence VARCHAR(200) NOT NULL, 
	type VARCHAR(6) NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE TABLE disponibilite (
	id INTEGER NOT NULL, 
	jour VARCHAR(8) NOT NULL, 
	heure_debut VARCHAR(5) NOT NULL, 
	heure_fin VARCHAR(5) NOT NULL, 
	user_id INTEGER NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE TABLE offre (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	competence VARCHAR NOT NULL, 
	description VARCHAR(500), 
	type VARCHAR(7) NOT NULL, 
	format VARCHAR(10) NOT NULL, 
	statut VARCHAR(8) NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE TABLE messages (
	id INTEGER NOT NULL, 
	sender_id INTEGER NOT NULL, 
	receiver_id INTEGER NOT NULL, 
	contenu VARCHAR NOT NULL, 
	is_link BOOLEAN NOT NULL, 
	read BOOLEAN NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(sender_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(receiver_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX ix_messages_sender_id ON messages (sender_id);
CREATE INDEX ix_messages_receiver_id ON messages (receiver_id);
CREATE TABLE offre_response (
	id INTEGER NOT NULL, 
	offre_id INTEGER NOT NULL, 
	answer_id INTEGER NOT NULL, 
	created_at DATETIME NOT NULL, 
	statut VARCHAR(8) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(offre_id) REFERENCES offre (id) ON DELETE CASCADE, 
	FOREIGN KEY(answer_id) REFERENCES users (id) ON DELETE CASCADE
);
