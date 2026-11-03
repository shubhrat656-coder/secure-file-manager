-- Secure File Manager - table definitions
--
-- Roles: user, level1, level2, manager, admin
-- Approval flow: pending_l1 -> pending_l2 -> pending_manager -> approved (or rejected)
--
-- Note: this file only creates tables. The database itself is created either by
-- `npm run seed` (local MySQL) or in your cloud provider's console.

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user','level1','level2','manager','admin') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS files (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_name   VARCHAR(255) NOT NULL,
  mime_type     VARCHAR(120),
  size          BIGINT NOT NULL,
  uploaded_by   INT NOT NULL,
  status        ENUM('pending_l1','pending_l2','pending_manager','approved','rejected')
                NOT NULL DEFAULT 'pending_l1',
  current_level TINYINT NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_files_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS approval_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  file_id    INT NOT NULL,
  actor_id   INT NOT NULL,
  action     ENUM('uploaded','approved','rejected') NOT NULL,
  level      TINYINT NOT NULL DEFAULT 0,
  comment    VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  CONSTRAINT fk_logs_user FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_files_status ON files(status);
CREATE INDEX idx_logs_file ON approval_logs(file_id);
