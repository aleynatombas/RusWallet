-- EF geçmişinde migration kayıtlı ama sütunlar yoksa bu betiği SSMS'te RusWallet veritabanında çalıştırın.
-- Ardından API'yi yeniden başlatın.

IF COL_LENGTH(N'dbo.Users', N'PasswordResetToken') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD PasswordResetToken NVARCHAR(128) NULL;
END
GO

IF COL_LENGTH(N'dbo.Users', N'PasswordResetTokenExpires') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD PasswordResetTokenExpires DATETIME2 NULL;
END
GO
