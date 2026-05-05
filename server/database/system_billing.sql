-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3308
-- Generation Time: Apr 30, 2026 at 04:24 PM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `system_billing`
--

-- --------------------------------------------------------

--
-- Table structure for table `aduan`
--

CREATE TABLE `aduan` (
  `ID_ADUAN` int NOT NULL,
  `ID_PELANGGAN` int NOT NULL,
  `SUBJEK` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `DESKRIPSI_MASALAH` text,
  `FOTO_KENDALA` varchar(500) DEFAULT NULL,
  `STATUS_ADUAN` enum('pending','proses','selesai','') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `TANGGAL_ADUAN` timestamp NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifikasi`
--

CREATE TABLE `notifikasi` (
  `ID_PELANGGAN` int NOT NULL,
  `ID_NOTIFIKASI` int NOT NULL,
  `RELATED_ID` int DEFAULT NULL,
  `JUDUL` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `DESKRIPSI_PESAN` text,
  `KATEGORI_NOTIFIKASI` enum('pembayaran','upgrade','aduan','reschedule perbaikan','jadwal perbaikan','jatuh tempo') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TANGGAL_NOTIFIKASI` datetime DEFAULT CURRENT_TIMESTAMP,
  `IS_READ` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `paket`
--

CREATE TABLE `paket` (
  `ID_PAKET` int NOT NULL,
  `NAMA_PAKET` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `HARGA_PAKET` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `paket`
--

INSERT INTO `paket` (`ID_PAKET`, `NAMA_PAKET`, `HARGA_PAKET`) VALUES
(1, '10MBPS', '100000.00'),
(2, '15MBPS', '130000.00'),
(3, '20MBPS', '150000.00'),
(4, '25MBPS', '180000.00'),
(5, '35MBPS', '220000.00'),
(6, '50MBPS', '250000.00');

-- --------------------------------------------------------

--
-- Table structure for table `pegawai`
--

CREATE TABLE `pegawai` (
  `ID_PEGAWAI` int NOT NULL,
  `NAMA` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `USERNAME` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PASSWORD` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ROLE` char(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `WILAYAH` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pelanggan`
--

CREATE TABLE `pelanggan` (
  `ID_PAKET` int DEFAULT NULL,
  `STATUS_PELANGGAN` enum('calon','aktif') DEFAULT 'calon',
  `STATUS_LAYANAN` enum('aktif','blokir') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ID_PELANGGAN` int NOT NULL,
  `NAMA_PELANGGAN` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ALAMAT` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ALAMAT_WILAYAH` varchar(100) DEFAULT NULL,
  `KODE_PELANGGAN` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `NO_HP` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PASSWORD` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TANGGAL_AKTIVASI` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `pelanggan`
--

INSERT INTO `pelanggan` (`ID_PAKET`, `STATUS_PELANGGAN`, `STATUS_LAYANAN`, `ID_PELANGGAN`, `NAMA_PELANGGAN`, `ALAMAT`, `ALAMAT_WILAYAH`, `KODE_PELANGGAN`, `NO_HP`, `PASSWORD`, `TANGGAL_AKTIVASI`) VALUES
(4, 'aktif', 'aktif', 1, 'Rosita', 'Puri Sasmaya Blok A6 No.2', 'Batu Aji', 'SGP123', '082288002262', '$2b$10$JnisJqouTN7JCJ5PvKUfpuE/qqcWzpgvUQhkIQLd8a2Bh3z29XRIq', '2026-03-11 17:27:16'),
(NULL, 'calon', 'aktif', 2, 'Alya Zahirah', 'Alexandria B1-06', 'Batam Center', 'SGP124', '082392096019', '$2b$10$Pgs2/9nqCEag8o787KpOoOfS1kCwGryFr.Lqf9ZD1G.1lSZo.Jzzy', '2026-04-29 16:19:30'),
(3, 'aktif', NULL, 3, 'ilham', 'mutiara biru c 30', 'Batu Ampar', 'SGP125', '08123456789', '$2b$10$M2bNx0Wl9yaJkUpEq5Ptb.gqXpyiAdjq75jZJCAVdu138esUmRm1.', '2026-04-30 15:32:41');

-- --------------------------------------------------------

--
-- Table structure for table `reschedule`
--

CREATE TABLE `reschedule` (
  `ID_RESCHEDULE` int NOT NULL,
  `ID_PEGAWAI` int NOT NULL,
  `TANGGAL_LAMA` date NOT NULL,
  `TANGGAL_BARU` date NOT NULL,
  `JAM_LAMA` time DEFAULT NULL,
  `JAM_BARU` time DEFAULT NULL,
  `DESKRIPSI` text,
  `STATUS_RESCHEDULE` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'pending',
  `ID_TICKET` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tagihan`
--

CREATE TABLE `tagihan` (
  `ID_PELANGGAN` int NOT NULL,
  `ID_TAGIHAN` int NOT NULL,
  `TANGGAL_PEMBAYARAN` datetime DEFAULT NULL,
  `METODE_PEMBAYARAN` varchar(200) DEFAULT NULL,
  `STATUS_VERIFIKASI` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ID_TRANSAKSI` varchar(50) NOT NULL,
  `PAYMENT_TIME` datetime DEFAULT NULL,
  `PAYMENT_URL` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `NOMOR_TAGIHAN` int NOT NULL,
  `TAHUN_TAGIHAN` int DEFAULT NULL,
  `BULAN_TAGIHAN` int DEFAULT NULL,
  `JUMLAH_BAYAR` decimal(12,2) NOT NULL,
  `JATUH_TEMPO` date NOT NULL,
  `STATUS_PEMBAYARAN` enum('berhasil','menunggu_verifikasi') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tagihan`
--

INSERT INTO `tagihan` (`ID_PELANGGAN`, `ID_TAGIHAN`, `TANGGAL_PEMBAYARAN`, `METODE_PEMBAYARAN`, `STATUS_VERIFIKASI`, `ID_TRANSAKSI`, `PAYMENT_TIME`, `PAYMENT_URL`, `NOMOR_TAGIHAN`, `TAHUN_TAGIHAN`, `BULAN_TAGIHAN`, `JUMLAH_BAYAR`, `JATUH_TEMPO`, `STATUS_PEMBAYARAN`) VALUES
(3, 2, '2026-04-30 16:00:44', NULL, NULL, 'REG-3-1777564773357', NULL, NULL, 137500, 2026, 4, '150000.00', '2026-05-01', 'berhasil');

-- --------------------------------------------------------

--
-- Table structure for table `ticket`
--

CREATE TABLE `ticket` (
  `ID_PEGAWAI` int NOT NULL,
  `ID_TICKET` int NOT NULL,
  `ID_ADUAN` int NOT NULL,
  `SCHEDULE_DATE` date DEFAULT NULL,
  `SCHEDULE_TIME` time DEFAULT NULL,
  `TICKET_STATUS` enum('open','on progress','selesai','') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `NOTES` text,
  `KONFIRMASI_SENT` datetime DEFAULT NULL,
  `IS_READ` tinyint(1) NOT NULL DEFAULT '0',
  `IS_CONFIRMED` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `upgrade_layanan`
--

CREATE TABLE `upgrade_layanan` (
  `ID_UPGRADE` int NOT NULL,
  `ID_PAKET_BARU` int DEFAULT NULL,
  `STATUS_UPGRADE` enum('pending','berhasil','ditolak') NOT NULL DEFAULT 'pending',
  `TANGGAL_REQUEST` datetime DEFAULT NULL,
  `TANGGAL_COMPLETE` datetime DEFAULT NULL,
  `ID_PELANGGAN` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `aduan`
--
ALTER TABLE `aduan`
  ADD PRIMARY KEY (`ID_ADUAN`),
  ADD KEY `FK_ADUAN_PELANGGAN` (`ID_PELANGGAN`);

--
-- Indexes for table `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD PRIMARY KEY (`ID_NOTIFIKASI`),
  ADD KEY `FK_NOTIFIKASI_PELANGGAN` (`ID_PELANGGAN`);

--
-- Indexes for table `paket`
--
ALTER TABLE `paket`
  ADD PRIMARY KEY (`ID_PAKET`);

--
-- Indexes for table `pegawai`
--
ALTER TABLE `pegawai`
  ADD PRIMARY KEY (`ID_PEGAWAI`),
  ADD UNIQUE KEY `USERNAME` (`USERNAME`);

--
-- Indexes for table `pelanggan`
--
ALTER TABLE `pelanggan`
  ADD PRIMARY KEY (`ID_PELANGGAN`),
  ADD UNIQUE KEY `KODE_PELANGGAN` (`KODE_PELANGGAN`),
  ADD KEY `FK_PELANGGA_AKTIVASI_PAKET` (`ID_PAKET`);

--
-- Indexes for table `reschedule`
--
ALTER TABLE `reschedule`
  ADD PRIMARY KEY (`ID_RESCHEDULE`),
  ADD KEY `FK_RESCHEDU_NERIMA_PEGAWAI` (`ID_PEGAWAI`),
  ADD KEY `FK_RESCHEDULE_TICKET` (`ID_TICKET`);

--
-- Indexes for table `tagihan`
--
ALTER TABLE `tagihan`
  ADD PRIMARY KEY (`ID_TAGIHAN`),
  ADD KEY `FK_TAGIHAN_PELANGGAN` (`ID_PELANGGAN`);

--
-- Indexes for table `ticket`
--
ALTER TABLE `ticket`
  ADD PRIMARY KEY (`ID_TICKET`),
  ADD UNIQUE KEY `ID_ADUAN` (`ID_ADUAN`),
  ADD KEY `FK_TICKET_TEKNISI_H_PEGAWAI` (`ID_PEGAWAI`);

--
-- Indexes for table `upgrade_layanan`
--
ALTER TABLE `upgrade_layanan`
  ADD PRIMARY KEY (`ID_UPGRADE`),
  ADD KEY `FK_UPGRADE_PAKET` (`ID_PAKET_BARU`),
  ADD KEY `FK_UPGRADE_PELANGGAN` (`ID_PELANGGAN`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `aduan`
--
ALTER TABLE `aduan`
  MODIFY `ID_ADUAN` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifikasi`
--
ALTER TABLE `notifikasi`
  MODIFY `ID_NOTIFIKASI` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `paket`
--
ALTER TABLE `paket`
  MODIFY `ID_PAKET` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `pelanggan`
--
ALTER TABLE `pelanggan`
  MODIFY `ID_PELANGGAN` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `reschedule`
--
ALTER TABLE `reschedule`
  MODIFY `ID_RESCHEDULE` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tagihan`
--
ALTER TABLE `tagihan`
  MODIFY `ID_TAGIHAN` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `ticket`
--
ALTER TABLE `ticket`
  MODIFY `ID_TICKET` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `upgrade_layanan`
--
ALTER TABLE `upgrade_layanan`
  MODIFY `ID_UPGRADE` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `aduan`
--
ALTER TABLE `aduan`
  ADD CONSTRAINT `FK_ADUAN_PELANGGAN` FOREIGN KEY (`ID_PELANGGAN`) REFERENCES `pelanggan` (`ID_PELANGGAN`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD CONSTRAINT `FK_NOTIFIKASI_PELANGGAN` FOREIGN KEY (`ID_PELANGGAN`) REFERENCES `pelanggan` (`ID_PELANGGAN`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `pelanggan`
--
ALTER TABLE `pelanggan`
  ADD CONSTRAINT `FK_PELANGGA_AKTIVASI_PAKET` FOREIGN KEY (`ID_PAKET`) REFERENCES `paket` (`ID_PAKET`);

--
-- Constraints for table `reschedule`
--
ALTER TABLE `reschedule`
  ADD CONSTRAINT `FK_RESCHEDU_NERIMA_PEGAWAI` FOREIGN KEY (`ID_PEGAWAI`) REFERENCES `pegawai` (`ID_PEGAWAI`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `FK_RESCHEDULE_TICKET` FOREIGN KEY (`ID_TICKET`) REFERENCES `ticket` (`ID_TICKET`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tagihan`
--
ALTER TABLE `tagihan`
  ADD CONSTRAINT `FK_TAGIHAN_PELANGGAN` FOREIGN KEY (`ID_PELANGGAN`) REFERENCES `pelanggan` (`ID_PELANGGAN`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `ticket`
--
ALTER TABLE `ticket`
  ADD CONSTRAINT `FK_TICKET_MEMILIKI2_ADUAN` FOREIGN KEY (`ID_ADUAN`) REFERENCES `aduan` (`ID_ADUAN`),
  ADD CONSTRAINT `FK_TICKET_TEKNISI_H_PEGAWAI` FOREIGN KEY (`ID_PEGAWAI`) REFERENCES `pegawai` (`ID_PEGAWAI`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `upgrade_layanan`
--
ALTER TABLE `upgrade_layanan`
  ADD CONSTRAINT `FK_UPGRADE_PAKET` FOREIGN KEY (`ID_PAKET_BARU`) REFERENCES `paket` (`ID_PAKET`),
  ADD CONSTRAINT `FK_UPGRADE_PELANGGAN` FOREIGN KEY (`ID_PELANGGAN`) REFERENCES `pelanggan` (`ID_PELANGGAN`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
