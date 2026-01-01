-- 1. Create the Schema (Database) Container
CREATE SCHEMA IF NOT EXISTS `RehearsalHub` DEFAULT CHARACTER SET utf8mb4;
USE `RehearsalHub`;

-- 2. Disable checks temporarily to avoid errors during import
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Table `users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `firebase_uid` VARCHAR(128) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) NOT NULL,
  `photourl` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `users_firebase_uid_key` (`firebase_uid` ASC),
  INDEX `idx_users_firebase_uid` (`firebase_uid` ASC)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `bands`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bands` (
  `band_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(128) NOT NULL,
  `invite_code` VARCHAR(12) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`band_id`),
  UNIQUE INDEX `bands_invite_code_key` (`invite_code` ASC)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `band_members`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `band_members` (
  `band_member_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL DEFAULT NULL,
  `band_id` INT NULL DEFAULT NULL,
  PRIMARY KEY (`band_member_id`),
  UNIQUE INDEX `unique_band_member` (`user_id` ASC, `band_id` ASC),
  INDEX `idx_band_members_user_band` (`user_id` ASC, `band_id` ASC),
  INDEX `fk_band_members_band` (`band_id` ASC),
  CONSTRAINT `fk_band_members_band`
    FOREIGN KEY (`band_id`)
    REFERENCES `bands` (`band_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_band_members_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `roles`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE INDEX `roles_title_key` (`title` ASC)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `member_roles`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `member_roles` (
  `band_member_id` INT NOT NULL,
  `role_id` INT NOT NULL,
  PRIMARY KEY (`band_member_id`, `role_id`),
  INDEX `fk_member_roles_role` (`role_id` ASC),
  CONSTRAINT `fk_member_roles_member`
    FOREIGN KEY (`band_member_id`)
    REFERENCES `band_members` (`band_member_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_member_roles_role`
    FOREIGN KEY (`role_id`)
    REFERENCES `roles` (`role_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `collections`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `collections` (
  `collection_id` INT NOT NULL AUTO_INCREMENT,
  `band_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `type` ENUM('EP', 'Album', 'Single') NULL DEFAULT NULL,
  `release_date` DATE NULL DEFAULT NULL,
  `cover_url` TEXT NULL DEFAULT NULL,
  `created_by` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`collection_id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `songs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `songs` (
  `song_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `key` VARCHAR(4) NULL DEFAULT NULL,
  `length` TIME NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT NULL DEFAULT NULL,
  `status` VARCHAR(20) NULL DEFAULT NULL,
  `bpm` SMALLINT NULL DEFAULT NULL,
  `cloudurl` TEXT NULL DEFAULT NULL,
  `band_id` INT NOT NULL,
  PRIMARY KEY (`song_id`),
  INDEX `fk_songs_band` (`band_id` ASC),
  CONSTRAINT `fk_songs_band`
    FOREIGN KEY (`band_id`)
    REFERENCES `bands` (`band_id`)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `collection_songs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `collection_songs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `collection_id` INT NULL DEFAULT NULL,
  `song_id` INT NULL DEFAULT NULL,
  `position` SMALLINT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `collection_songs_collection_id_position_key` (`collection_id` ASC, `position` ASC),
  UNIQUE INDEX `collection_songs_collection_id_song_id_key` (`collection_id` ASC, `song_id` ASC),
  INDEX `collection_songs_song_id_fkey` (`song_id` ASC),
  CONSTRAINT `collection_songs_collection_id_fkey`
    FOREIGN KEY (`collection_id`)
    REFERENCES `collections` (`collection_id`)
    ON DELETE CASCADE,
  CONSTRAINT `collection_songs_song_id_fkey`
    FOREIGN KEY (`song_id`)
    REFERENCES `songs` (`song_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `events`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `events` (
  `event_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `type` VARCHAR(20) NULL DEFAULT NULL,
  `date_time` DATETIME NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `band_id` INT NOT NULL,
  PRIMARY KEY (`event_id`),
  INDEX `fk_events_band` (`band_id` ASC),
  CONSTRAINT `fk_events_band`
    FOREIGN KEY (`band_id`)
    REFERENCES `bands` (`band_id`)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `messages`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `message_id` INT NOT NULL AUTO_INCREMENT,
  `text` TEXT NOT NULL,
  `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `band_member_id` INT NOT NULL,
  PRIMARY KEY (`message_id`),
  INDEX `idx_messages_band_sentat_id_desc` (`band_member_id` ASC, `sent_at` DESC, `message_id` DESC),
  CONSTRAINT `fk_messages_member`
    FOREIGN KEY (`band_member_id`)
    REFERENCES `band_members` (`band_member_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `musideas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `musideas` (
  `idea_id` INT NOT NULL AUTO_INCREMENT,
  `band_member_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `key` VARCHAR(4) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `length` TIME NULL DEFAULT NULL,
  `bpm` SMALLINT NULL DEFAULT NULL,
  `audiourl` TEXT NULL DEFAULT NULL,
  `text_tabs` TEXT NULL DEFAULT NULL,
  `visibility` VARCHAR(10) NULL DEFAULT 'private',
  PRIMARY KEY (`idea_id`),
  INDEX `fk_musideas_member` (`band_member_id` ASC),
  CONSTRAINT `fk_musideas_member`
    FOREIGN KEY (`band_member_id`)
    REFERENCES `band_members` (`band_member_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `practice_sessions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `practice_sessions` (
  `practice_session_id` INT NOT NULL AUTO_INCREMENT,
  `length` TIME NOT NULL,
  `notes` TEXT NULL DEFAULT NULL,
  `started_at` DATETIME NULL DEFAULT NULL,
  `user_id` INT NOT NULL,
  PRIMARY KEY (`practice_session_id`),
  INDEX `fk_practice_user` (`user_id` ASC),
  CONSTRAINT `fk_practice_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `setlists`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `setlists` (
  `setlist_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(128) NOT NULL,
  PRIMARY KEY (`setlist_id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `setlists_songs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `setlists_songs` (
  `setlists_songs_id` INT NOT NULL AUTO_INCREMENT,
  `setlist_id` INT NOT NULL,
  `song_id` INT NOT NULL,
  `position` SMALLINT NOT NULL,
  PRIMARY KEY (`setlists_songs_id`),
  UNIQUE INDEX `unique_setlist_song` (`setlist_id` ASC, `song_id` ASC),
  INDEX `fk_setlists_songs_song` (`song_id` ASC),
  CONSTRAINT `fk_setlists_songs_setlist`
    FOREIGN KEY (`setlist_id`)
    REFERENCES `setlists` (`setlist_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_setlists_songs_song`
    FOREIGN KEY (`song_id`)
    REFERENCES `songs` (`song_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `tags`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tags` (
  `tag_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(60) NOT NULL,
  `band_id` INT NULL DEFAULT NULL,
  `created_by` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `color` VARCHAR(7) NULL DEFAULT NULL,
  PRIMARY KEY (`tag_id`),
  UNIQUE INDEX `idx_tags_unique` (`band_id` ASC, `name` ASC),
  INDEX `idx_tags_band` (`band_id` ASC)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `song_tags`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `song_tags` (
  `song_tag_id` INT NOT NULL AUTO_INCREMENT,
  `song_id` INT NOT NULL,
  `tag_id` INT NOT NULL,
  PRIMARY KEY (`song_tag_id`),
  INDEX `idx_song_tags_song` (`song_id` ASC),
  INDEX `idx_song_tags_tag` (`tag_id` ASC),
  CONSTRAINT `song_tags_song_id_fkey`
    FOREIGN KEY (`song_id`)
    REFERENCES `songs` (`song_id`)
    ON DELETE CASCADE,
  CONSTRAINT `song_tags_tag_id_fkey`
    FOREIGN KEY (`tag_id`)
    REFERENCES `tags` (`tag_id`)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `tasks`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tasks` (
  `task_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `due_date` DATE NULL DEFAULT NULL,
  `band_member_id` INT NOT NULL,
  PRIMARY KEY (`task_id`),
  INDEX `fk_tasks_member` (`band_member_id` ASC),
  CONSTRAINT `fk_tasks_member`
    FOREIGN KEY (`band_member_id`)
    REFERENCES `band_members` (`band_member_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- Restore previous checks
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;