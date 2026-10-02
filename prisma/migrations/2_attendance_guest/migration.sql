-- Attendance menerima kunjungan tanpa member (guest daypass)
ALTER TABLE "Attendance" ALTER COLUMN "memberId" DROP NOT NULL;
ALTER TABLE "Attendance" ADD COLUMN "guestName" TEXT;
