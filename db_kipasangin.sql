-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 15, 2026 at 06:50 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_kipasangin`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_log`
--

CREATE TABLE `activity_log` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `device_id` bigint(20) UNSIGNED NOT NULL,
  `action_type` varchar(50) NOT NULL COMMENT 'Jenis aksi: manual_on, manual_off, auto_on, auto_off, threshold_change',
  `temperature` decimal(5,2) DEFAULT NULL COMMENT 'Suhu saat aktivitas terjadi (°C)',
  `keterangan` text DEFAULT NULL COMMENT 'Catatan tambahan',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_log`
--

INSERT INTO `activity_log` (`id`, `device_id`, `action_type`, `temperature`, `keterangan`, `created_at`) VALUES
(6, 1, 'manual_off', 24.50, 'Sistem baru diinisialisasi (Laravel)', '2026-05-10 07:17:33'),
(7, 1, 'threshold_change', 32.00, 'Threshold default diatur ke 32°C', '2026-05-10 07:17:33'),
(8, 1, 'auto_on', 32.10, NULL, '2026-05-10 07:17:39'),
(9, 1, 'manual_off', 32.70, NULL, '2026-05-10 07:17:49'),
(10, 1, 'manual_on', 24.50, NULL, '2026-05-10 07:25:14'),
(11, 1, 'manual_off', 32.70, NULL, '2026-05-10 07:25:27'),
(12, 1, 'auto_on', 24.50, NULL, '2026-05-10 07:27:41'),
(13, 1, 'manual_off', 32.70, NULL, '2026-05-10 07:40:04'),
(14, 1, 'auto_on', 32.00, NULL, '2026-05-10 07:40:51'),
(15, 1, 'auto_off', 32.00, NULL, '2026-05-10 07:40:52'),
(16, 1, 'auto_on', 32.00, NULL, '2026-05-10 07:40:52'),
(17, 1, 'manual_off', 32.80, NULL, '2026-05-10 07:41:25'),
(18, 1, 'manual_on', 32.90, NULL, '2026-05-10 07:41:27'),
(19, 1, 'manual_off', 32.80, NULL, '2026-05-10 07:41:29'),
(20, 1, 'manual_on', 32.00, NULL, '2026-05-10 07:51:05'),
(21, 1, 'manual_off', 32.80, NULL, '2026-05-10 07:51:16'),
(22, 1, 'threshold_change', 45.00, NULL, '2026-05-10 08:09:07'),
(23, 1, 'auto_on', 32.80, NULL, '2026-05-10 08:09:25'),
(24, 1, 'auto_on', 32.80, NULL, '2026-05-10 08:09:25'),
(25, 1, 'auto_off', 32.20, NULL, '2026-05-10 08:09:29'),
(26, 1, 'auto_off', 32.20, NULL, '2026-05-10 08:09:29'),
(27, 1, 'manual_on', 32.60, NULL, '2026-05-10 08:09:35'),
(28, 1, 'auto_on', 32.60, NULL, '2026-05-10 08:09:36'),
(29, 1, 'manual_off', 32.20, NULL, '2026-05-10 08:09:40'),
(30, 1, 'auto_off', 32.20, NULL, '2026-05-10 08:09:40'),
(31, 1, 'auto_on', 32.40, NULL, '2026-05-10 08:42:41'),
(32, 1, 'threshold_change', 39.40, NULL, '2026-05-10 08:42:50'),
(33, 1, 'auto_off', 32.10, NULL, '2026-05-10 08:42:50'),
(34, 1, 'threshold_change', 33.20, NULL, '2026-05-10 08:42:54'),
(35, 1, 'threshold_change', 26.30, NULL, '2026-05-10 08:42:55'),
(36, 1, 'auto_on', 32.10, NULL, '2026-05-10 08:42:55'),
(37, 1, 'threshold_change', 38.30, NULL, '2026-05-10 08:43:02'),
(38, 1, 'auto_off', 32.20, NULL, '2026-05-10 08:43:02'),
(39, 1, 'manual_on', 32.20, NULL, '2026-05-10 08:43:08'),
(40, 1, 'manual_on', 32.10, NULL, '2026-05-10 08:43:12'),
(41, 1, 'threshold_change', 30.40, NULL, '2026-05-10 08:43:15'),
(42, 1, 'auto_on', 32.40, NULL, '2026-05-10 08:43:15'),
(43, 1, 'threshold_change', 26.40, NULL, '2026-05-10 08:43:18'),
(44, 1, 'threshold_change', 43.20, NULL, '2026-05-10 08:43:22'),
(45, 1, 'manual_on', 32.90, NULL, '2026-05-10 08:43:26'),
(46, 1, 'manual_off', 32.40, NULL, '2026-05-10 08:43:29'),
(47, 1, 'manual_on', 32.40, NULL, '2026-05-10 08:43:31'),
(48, 1, 'manual_off', 32.60, NULL, '2026-05-10 08:43:32'),
(49, 1, 'threshold_change', 32.90, NULL, '2026-05-10 08:43:37'),
(50, 1, 'auto_on', 32.20, NULL, '2026-05-10 08:43:39'),
(51, 1, 'threshold_change', 43.00, NULL, '2026-05-10 08:43:42'),
(52, 1, 'auto_off', 32.90, NULL, '2026-05-10 08:43:43'),
(53, 1, 'manual_on', 32.70, NULL, '2026-05-10 08:44:59'),
(54, 1, 'manual_on', 32.30, NULL, '2026-05-10 08:45:50'),
(55, 1, 'auto_on', 24.50, NULL, '2026-05-10 08:50:48'),
(56, 1, 'auto_on', 24.50, NULL, '2026-05-10 08:51:04'),
(57, 1, 'manual_off', 32.00, NULL, '2026-05-10 08:51:11'),
(58, 1, 'manual_on', 32.90, NULL, '2026-05-10 08:51:12'),
(59, 1, 'manual_off', 32.90, NULL, '2026-05-10 08:51:13'),
(60, 1, 'manual_on', 32.90, NULL, '2026-05-10 08:51:15'),
(61, 1, 'manual_off', 32.30, NULL, '2026-05-10 08:51:17'),
(62, 1, 'manual_on', 32.40, NULL, '2026-05-10 08:51:18'),
(63, 1, 'manual_off', 32.30, NULL, '2026-05-10 08:51:21'),
(64, 1, 'manual_on', 32.30, NULL, '2026-05-10 08:51:22'),
(65, 1, 'manual_off', 32.40, NULL, '2026-05-10 08:51:23'),
(66, 1, 'manual_on', 24.50, NULL, '2026-05-10 08:55:38'),
(67, 1, 'manual_off', 24.50, NULL, '2026-05-10 08:55:38'),
(68, 1, 'manual_on', 24.50, NULL, '2026-05-10 09:23:29'),
(69, 1, 'manual_off', 24.50, NULL, '2026-05-10 09:23:30'),
(70, 1, 'manual_on', 24.50, NULL, '2026-05-10 09:23:31'),
(71, 1, 'manual_off', 24.50, NULL, '2026-05-10 09:23:32'),
(72, 1, 'manual_on', 24.50, NULL, '2026-05-10 09:23:58'),
(73, 1, 'manual_off', 24.50, NULL, '2026-05-10 09:23:59'),
(74, 1, 'manual_on', 24.50, NULL, '2026-05-10 09:24:01'),
(75, 1, 'manual_off', 24.50, NULL, '2026-05-10 09:24:05'),
(76, 1, 'manual_on', 24.50, NULL, '2026-05-10 09:25:14'),
(77, 1, 'manual_off', 24.50, NULL, '2026-05-10 09:25:16'),
(78, 1, 'manual_on', 24.50, NULL, '2026-05-10 09:25:17'),
(79, 1, 'manual_off', 24.50, NULL, '2026-05-10 09:25:18'),
(80, 1, 'manual_on', 24.50, NULL, '2026-05-10 09:25:35'),
(81, 1, 'manual_off', 24.50, NULL, '2026-05-10 09:25:36'),
(82, 1, 'manual_on', 24.50, NULL, '2026-05-10 09:25:37'),
(83, 1, 'manual_off', 24.50, NULL, '2026-05-10 09:25:37'),
(84, 1, 'manual_on', 24.50, NULL, '2026-05-10 09:25:38'),
(85, 1, 'manual_off', 24.50, NULL, '2026-05-10 09:25:39'),
(86, 1, 'manual_on', 24.50, NULL, '2026-05-10 09:25:42'),
(87, 1, 'manual_off', 24.50, NULL, '2026-05-10 09:25:45'),
(88, 1, 'manual_on', 24.50, NULL, '2026-05-10 09:27:55'),
(89, 1, 'manual_off', 24.50, NULL, '2026-05-10 09:27:56'),
(90, 1, 'manual_on', 24.50, NULL, '2026-05-10 09:37:22'),
(91, 1, 'manual_off', 24.50, NULL, '2026-05-10 09:37:23'),
(92, 1, 'manual_on', 24.50, NULL, '2026-05-10 10:00:35'),
(93, 1, 'manual_off', 24.50, NULL, '2026-05-10 10:00:36'),
(94, 1, 'manual_off', 24.50, NULL, '2026-05-14 12:10:49'),
(95, 1, 'manual_on', 24.50, NULL, '2026-05-14 12:10:49'),
(96, 1, 'manual_on', 24.50, NULL, '2026-05-14 12:11:36'),
(97, 1, 'manual_off', 24.50, NULL, '2026-05-14 12:11:43'),
(98, 1, 'manual_on', 24.50, NULL, '2026-05-14 12:17:16'),
(99, 1, 'manual_off', 24.50, NULL, '2026-05-14 12:17:17'),
(100, 1, 'manual_on', 24.50, NULL, '2026-05-15 03:33:14'),
(101, 1, 'manual_off', 24.50, NULL, '2026-05-15 03:33:14'),
(102, 1, 'ERROR', NULL, 'Koneksi Terputus / Mati Lampu', '2026-05-10 07:25:44'),
(103, 1, 'ERROR', NULL, 'Koneksi Terputus / Mati Lampu', '2026-05-10 07:30:10'),
(104, 1, 'ERROR', NULL, 'Koneksi Terputus / Mati Lampu', '2026-05-10 07:48:48'),
(105, 1, 'ERROR', NULL, 'Koneksi Terputus / Mati Lampu', '2026-05-10 07:54:53'),
(106, 1, 'ERROR', NULL, 'Koneksi Terputus / Mati Lampu', '2026-05-10 07:57:32'),
(107, 1, 'ERROR', NULL, 'Koneksi Terputus / Mati Lampu', '2026-05-10 08:13:59'),
(108, 1, 'ERROR', NULL, 'Koneksi Terputus / Mati Lampu', '2026-05-10 08:15:47'),
(109, 1, 'ERROR', NULL, 'Koneksi Terputus / Mati Lampu', '2026-05-10 08:42:47'),
(110, 1, 'ERROR', NULL, 'Koneksi Terputus / Mati Lampu', '2026-05-10 08:42:56'),
(111, 1, 'ERROR', NULL, 'Koneksi Terputus / Mati Lampu', '2026-05-10 08:43:01'),
(112, 1, 'ERROR', NULL, 'Koneksi Terputus / Mati Lampu', '2026-05-10 08:43:08'),
(113, 1, 'ERROR', NULL, 'Koneksi Terputus / Mati Lampu', '2026-05-10 08:43:28'),
(114, 1, 'ERROR', NULL, 'Koneksi Terputus / Mati Lampu', '2026-05-10 08:43:44'),
(115, 1, 'ERROR', NULL, 'Koneksi Terputus / Mati Lampu', '2026-05-10 08:43:50'),
(116, 1, 'ERROR', NULL, 'Koneksi Terputus / Mati Lampu', '2026-05-10 08:55:22');

-- --------------------------------------------------------

--
-- Table structure for table `master_kipas`
--

CREATE TABLE `master_kipas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `device_id` varchar(50) NOT NULL COMMENT 'ID unik perangkat, misal: FAN-001',
  `nama_kipas` varchar(100) NOT NULL COMMENT 'Nama tampilan perangkat',
  `status` enum('ON','OFF','AUTO') NOT NULL DEFAULT 'OFF' COMMENT 'Status terakhir perangkat',
  `suhu` decimal(5,2) DEFAULT NULL COMMENT 'Suhu terakhir terbaca (°C)',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP address ESP32',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `master_kipas`
--

INSERT INTO `master_kipas` (`id`, `device_id`, `nama_kipas`, `status`, `suhu`, `ip_address`, `created_at`, `updated_at`) VALUES
(1, 'FAN-001', 'Smart Fan', 'ON', 24.50, '192.168.1.100', '2026-05-10 00:17:33', '2026-05-14 20:33:14');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2025_01_01_000010_create_master_kipas_table', 1),
(2, '2025_01_01_000011_create_activity_log_table', 1),
(4, '2026_05_10_074450_simplify_database_schema', 2);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_log`
--
ALTER TABLE `activity_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_log_device_id_foreign` (`device_id`);

--
-- Indexes for table `master_kipas`
--
ALTER TABLE `master_kipas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `master_kipas_device_id_unique` (`device_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_log`
--
ALTER TABLE `activity_log`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=117;

--
-- AUTO_INCREMENT for table `master_kipas`
--
ALTER TABLE `master_kipas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_log`
--
ALTER TABLE `activity_log`
  ADD CONSTRAINT `activity_log_device_id_foreign` FOREIGN KEY (`device_id`) REFERENCES `master_kipas` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
