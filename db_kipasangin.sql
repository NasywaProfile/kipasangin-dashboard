-- ============================================================
--  DATABASE: db_kipasangin
--  Smart Fan IoT Dashboard — Nasywa Davina
--  Dibuat untuk diimport ke phpMyAdmin (XAMPP / MySQL)
-- ============================================================

-- 1. Buat database (jalankan jika belum ada)
CREATE DATABASE IF NOT EXISTS `db_kipasangin`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `db_kipasangin`;

-- ============================================================
-- TABEL 1: master_kipas
-- Menyimpan data setiap perangkat kipas yang terdaftar
-- ============================================================
CREATE TABLE IF NOT EXISTS `master_kipas` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `device_id`   VARCHAR(50)  NOT NULL UNIQUE COMMENT 'ID unik perangkat, misal: FAN-001',
  `nama_kipas`  VARCHAR(100) NOT NULL            COMMENT 'Nama tampilan perangkat',
  `lokasi`      VARCHAR(150) DEFAULT NULL        COMMENT 'Lokasi pemasangan perangkat',
  `status`      ENUM('ON','OFF','AUTO') NOT NULL DEFAULT 'OFF' COMMENT 'Status terakhir perangkat',
  `suhu`        DECIMAL(5,2) DEFAULT NULL        COMMENT 'Suhu terakhir yang terbaca (°C)',
  `kecepatan`   TINYINT UNSIGNED DEFAULT 0       COMMENT 'Kecepatan kipas 0–100%',
  `ip_address`  VARCHAR(45)  DEFAULT NULL        COMMENT 'IP address ESP32/Arduino',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_device_id` (`device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL 2: activity_log
-- Mencatat setiap aktivitas / perintah yang dikirim ke kipas
-- ============================================================
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `device_id`   INT          NOT NULL            COMMENT 'FK ke master_kipas.id',
  `action_type` VARCHAR(50)  NOT NULL            COMMENT 'Jenis aksi: ON, OFF, AUTO, SET_SPEED, dsb.',
  `temperature` DECIMAL(5,2) DEFAULT NULL        COMMENT 'Suhu saat aktivitas terjadi (°C)',
  `keterangan`  TEXT         DEFAULT NULL        COMMENT 'Catatan tambahan (opsional)',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_device` (`device_id`),
  INDEX `idx_created` (`created_at`),
  CONSTRAINT `fk_actlog_device`
    FOREIGN KEY (`device_id`) REFERENCES `master_kipas` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL 3: error_log
-- Mencatat error / kejadian tidak normal pada perangkat
-- ============================================================
CREATE TABLE IF NOT EXISTS `error_log` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `device_id`   INT          NOT NULL            COMMENT 'FK ke master_kipas.id',
  `error_code`  VARCHAR(30)  DEFAULT NULL        COMMENT 'Kode error singkat (opsional)',
  `error_msg`   TEXT         NOT NULL            COMMENT 'Pesan error lengkap',
  `severity`    ENUM('INFO','WARNING','ERROR','CRITICAL') NOT NULL DEFAULT 'ERROR' COMMENT 'Tingkat keparahan',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_device` (`device_id`),
  INDEX `idx_created` (`created_at`),
  CONSTRAINT `fk_errlog_device`
    FOREIGN KEY (`device_id`) REFERENCES `master_kipas` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATA AWAL (SEED) — Contoh 1 perangkat kipas
-- ============================================================
INSERT IGNORE INTO `master_kipas`
  (`device_id`, `nama_kipas`, `lokasi`, `status`, `suhu`, `kecepatan`, `ip_address`)
VALUES
  ('FAN-001', 'Kipas Ruang Tengah', 'Ruang Tengah Lt.1', 'OFF', 0.00, 0, '192.168.1.100');

-- ============================================================
-- SELESAI — Import file ini lewat phpMyAdmin > Import > pilih file ini
-- ============================================================
