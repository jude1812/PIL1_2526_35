PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
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
INSERT INTO users VALUES(1,'Hounsou','Sam','sam@ifri.bj','0197000001','Passionné d''IA, je cherche à progresser en programmation','$2b$12$ANEvLbDWiOZY9QApOlqbyemdm7IrJZVWFi.aqrAisS7G37HCnb0b6','$2b$12$d3/eBf0Le/PQXZTwQ2VeyuFhVRQVvFYMI8AT8j2DNaDf1GYHx72Ge','Nom de ton premier animal ?','IA','L1',NULL,'2026-06-08 22:04:11.035925');
INSERT INTO users VALUES(2,'Koudjo','Felix','felix@ifri.bj','0197000002','Dev web fullstack, je peux aider en programmation','$2b$12$4kX4/QWOqka13wePm6Z4zebwl9s23qd1OiUhYBR8erhA3u/AZUS9q','$2b$12$iTRqiWlXeCezLErifyM4buq/O4gQ3pHVcgPMb4/RRkw5Y2F6c1uXm','Ta rue d''enfance ?','GL','L1',NULL,'2026-06-08 22:04:11.798750');
INSERT INTO users VALUES(3,'Bernard','Marie','marie@ifri.bj','0197000003','Experte en analyse de données et statistiques','$2b$12$GacGMuxJ/B/hC8U3.cfaSenFAfZN8BVCOeJOxaLem8hkkrh/ZXv52','$2b$12$9jSJdt4LHcAPdA/0AXYGresNrxhBBbU0UYI0GDxSxt2eOpDIJouya','Nom de ton premier professeur ?','IM','L2',NULL,'2026-06-08 22:04:12.392346');
INSERT INTO users VALUES(4,'Martin','Jean','jean@ifri.bj','0197000004','IoT et embarqué, je peux aider sur les projets techniques','$2b$12$h/A3i29m4tCx/VD16OxHCeBU5W2rsQyEqkuN0TwSwjXpI83FJF9mq','$2b$12$0knkXHgbqgpc4J9mycSZAuwEG3wIj7hMNilV26iJA9r9XPD/qJY/y','Marque de ta première voiture ?','SE','M1',NULL,'2026-06-08 22:04:12.932786');
CREATE TABLE user_skills (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	competence VARCHAR(200) NOT NULL, 
	type VARCHAR(6) NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
INSERT INTO user_skills VALUES(1,1,'Python','fort','2026-06-08 22:04:11.054637');
INSERT INTO user_skills VALUES(2,1,'Machine Learning','faible','2026-06-08 22:04:11.066953');
INSERT INTO user_skills VALUES(3,1,'SQL','faible','2026-06-08 22:04:11.075488');
INSERT INTO user_skills VALUES(4,2,'Python','fort','2026-06-08 22:04:11.809841');
INSERT INTO user_skills VALUES(5,2,'SQL','fort','2026-06-08 22:04:11.818096');
INSERT INTO user_skills VALUES(6,2,'JavaScript','fort','2026-06-08 22:04:11.826078');
INSERT INTO user_skills VALUES(7,2,'React','faible','2026-06-08 22:04:11.833736');
INSERT INTO user_skills VALUES(8,3,'SQL','fort','2026-06-08 22:04:12.403491');
INSERT INTO user_skills VALUES(9,3,'Statistiques','fort','2026-06-08 22:04:12.410870');
INSERT INTO user_skills VALUES(10,3,'Python','fort','2026-06-08 22:04:12.417977');
INSERT INTO user_skills VALUES(11,3,'Machine Learning','fort','2026-06-08 22:04:12.425189');
INSERT INTO user_skills VALUES(12,4,'C++','fort','2026-06-08 22:04:12.941914');
INSERT INTO user_skills VALUES(13,4,'Arduino','fort','2026-06-08 22:04:12.948810');
INSERT INTO user_skills VALUES(14,4,'Raspberry Pi','fort','2026-06-08 22:04:12.955217');
INSERT INTO user_skills VALUES(15,4,'Python','fort','2026-06-08 22:04:12.962176');
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
INSERT INTO disponibilite VALUES(1,'lundi','14:00','16:00',1,'2026-06-08 22:04:11.083817');
INSERT INTO disponibilite VALUES(2,'mercredi','10:00','12:00',1,'2026-06-08 22:04:11.095379');
INSERT INTO disponibilite VALUES(3,'vendredi','15:00','17:00',1,'2026-06-08 22:04:11.104124');
INSERT INTO disponibilite VALUES(4,'lundi','13:00','17:00',2,'2026-06-08 22:04:11.841646');
INSERT INTO disponibilite VALUES(5,'mardi','09:00','12:00',2,'2026-06-08 22:04:11.850223');
INSERT INTO disponibilite VALUES(6,'jeudi','14:00','18:00',2,'2026-06-08 22:04:11.858882');
INSERT INTO disponibilite VALUES(7,'lundi','09:00','12:00',3,'2026-06-08 22:04:12.432008');
INSERT INTO disponibilite VALUES(8,'mercredi','14:00','18:00',3,'2026-06-08 22:04:12.439437');
INSERT INTO disponibilite VALUES(9,'vendredi','08:00','12:00',3,'2026-06-08 22:04:12.446532');
INSERT INTO disponibilite VALUES(10,'mardi','15:00','18:00',4,'2026-06-08 22:04:12.969046');
INSERT INTO disponibilite VALUES(11,'jeudi','10:00','12:00',4,'2026-06-08 22:04:12.976367');
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
INSERT INTO offre VALUES(1,1,'Python','J''ai besoin d''aide pour comprendre les concepts avancés de Python','demande','en_ligne','active','2026-06-08 22:04:11.112267');
INSERT INTO offre VALUES(2,2,'SQL','Je peux aider les débutants en SQL','offre','en_ligne','active','2026-06-08 22:04:11.867141');
INSERT INTO offre VALUES(3,2,'Python','Aide en Python (débutant à intermédiaire)','offre','presentiel','active','2026-06-08 22:04:11.875959');
INSERT INTO offre VALUES(4,3,'Statistiques','Aide en statistiques et analyse de données','offre','les_deux','active','2026-06-08 22:04:12.453929');
INSERT INTO offre VALUES(5,4,'IoT','Accompagnement sur projets IoT (Arduino, ESP32, capteurs)','offre','les_deux','active','2026-06-08 22:04:12.983634');
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
INSERT INTO messages VALUES(1,1,2,'Salut Felix ! Tu peux m''aider en Python ?',0,1,'2026-06-08 22:04:12.991410');
INSERT INTO messages VALUES(2,2,1,'Salut Sam ! Oui bien sûr, qu''est-ce qui te bloque ?',0,1,'2026-06-08 22:04:13.002808');
INSERT INTO messages VALUES(3,1,2,'Les compréhensions de listes et les décorateurs',0,0,'2026-06-08 22:04:13.015643');
INSERT INTO messages VALUES(4,1,3,'Bonjour Marie, tu es dispo pour discuter stats ?',0,1,'2026-06-08 22:04:13.023540');
INSERT INTO messages VALUES(5,3,1,'Oui, c''est a quel niveau?',0,0,'2026-06-08 22:05:54.488097');
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
INSERT INTO offre_response VALUES(1,2,1,'2026-06-08 22:04:13.029978','in_wait');
INSERT INTO offre_response VALUES(2,1,4,'2026-06-08 22:04:13.041742','in_wait');
CREATE UNIQUE INDEX ix_users_phone ON users (phone);
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE INDEX ix_messages_sender_id ON messages (sender_id);
CREATE INDEX ix_messages_receiver_id ON messages (receiver_id);
COMMIT;
