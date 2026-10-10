using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RusWallet.Infrastructure.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Bazı ortamlarda MonthlyIncomeNet / MonthlyFixedCostsApprox nvarchar olarak kalmış;
    /// EF decimal beklediği için onboarding ve profil okuma 500 veriyordu.
    /// </summary>
    public partial class FixUserMonthlyFinancialColumnTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Ayrı batch'ler: SQL Server yeni sütunu aynı batch içindeki UPDATE'te görmez.
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('dbo.Users', 'MonthlyIncomeNet') IS NOT NULL
                   AND EXISTS (
                       SELECT 1 FROM sys.columns c
                       JOIN sys.types t ON c.user_type_id = t.user_type_id
                       WHERE c.object_id = OBJECT_ID('dbo.Users') AND c.name = 'MonthlyIncomeNet'
                         AND t.name IN ('nvarchar', 'varchar', 'nchar', 'char'))
                    ALTER TABLE [Users] ADD [MonthlyIncomeNet__dec] decimal(18, 2) NULL;
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH('dbo.Users', 'MonthlyIncomeNet__dec') IS NOT NULL
                    UPDATE [Users]
                    SET [MonthlyIncomeNet__dec] = TRY_CONVERT(
                        decimal(18, 2),
                        REPLACE(REPLACE(LTRIM(RTRIM([MonthlyIncomeNet])), ',', '.'), ' ', ''))
                    WHERE [MonthlyIncomeNet] IS NOT NULL AND LTRIM(RTRIM([MonthlyIncomeNet])) <> '';
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH('dbo.Users', 'MonthlyIncomeNet__dec') IS NOT NULL
                BEGIN
                    ALTER TABLE [Users] DROP COLUMN [MonthlyIncomeNet];
                    EXEC sp_rename 'Users.MonthlyIncomeNet__dec', 'MonthlyIncomeNet', 'COLUMN';
                END
                ELSE IF COL_LENGTH('dbo.Users', 'MonthlyIncomeNet') IS NULL
                    ALTER TABLE [Users] ADD [MonthlyIncomeNet] decimal(18, 2) NULL;
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH('dbo.Users', 'MonthlyFixedCostsApprox') IS NOT NULL
                   AND EXISTS (
                       SELECT 1 FROM sys.columns c
                       JOIN sys.types t ON c.user_type_id = t.user_type_id
                       WHERE c.object_id = OBJECT_ID('dbo.Users') AND c.name = 'MonthlyFixedCostsApprox'
                         AND t.name IN ('nvarchar', 'varchar', 'nchar', 'char'))
                    ALTER TABLE [Users] ADD [MonthlyFixedCostsApprox__dec] decimal(18, 2) NULL;
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH('dbo.Users', 'MonthlyFixedCostsApprox__dec') IS NOT NULL
                    UPDATE [Users]
                    SET [MonthlyFixedCostsApprox__dec] = TRY_CONVERT(
                        decimal(18, 2),
                        REPLACE(REPLACE(LTRIM(RTRIM([MonthlyFixedCostsApprox])), ',', '.'), ' ', ''))
                    WHERE [MonthlyFixedCostsApprox] IS NOT NULL AND LTRIM(RTRIM([MonthlyFixedCostsApprox])) <> '';
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH('dbo.Users', 'MonthlyFixedCostsApprox__dec') IS NOT NULL
                BEGIN
                    ALTER TABLE [Users] DROP COLUMN [MonthlyFixedCostsApprox];
                    EXEC sp_rename 'Users.MonthlyFixedCostsApprox__dec', 'MonthlyFixedCostsApprox', 'COLUMN';
                END
                ELSE IF COL_LENGTH('dbo.Users', 'MonthlyFixedCostsApprox') IS NULL
                    ALTER TABLE [Users] ADD [MonthlyFixedCostsApprox] decimal(18, 2) NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('dbo.Users', 'MonthlyIncomeNet') IS NOT NULL
                   AND EXISTS (
                       SELECT 1
                       FROM sys.columns c
                       JOIN sys.types t ON c.user_type_id = t.user_type_id
                       WHERE c.object_id = OBJECT_ID('dbo.Users')
                         AND c.name = 'MonthlyIncomeNet'
                         AND t.name = 'decimal')
                BEGIN
                    ALTER TABLE [Users] ADD [MonthlyIncomeNet__str] nvarchar(64) NULL;
                    UPDATE [Users]
                    SET [MonthlyIncomeNet__str] = CONVERT(nvarchar(64), [MonthlyIncomeNet])
                    WHERE [MonthlyIncomeNet] IS NOT NULL;
                    ALTER TABLE [Users] DROP COLUMN [MonthlyIncomeNet];
                    EXEC sp_rename 'Users.MonthlyIncomeNet__str', 'MonthlyIncomeNet', 'COLUMN';
                END
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH('dbo.Users', 'MonthlyFixedCostsApprox') IS NOT NULL
                   AND EXISTS (
                       SELECT 1
                       FROM sys.columns c
                       JOIN sys.types t ON c.user_type_id = t.user_type_id
                       WHERE c.object_id = OBJECT_ID('dbo.Users')
                         AND c.name = 'MonthlyFixedCostsApprox'
                         AND t.name = 'decimal')
                BEGIN
                    ALTER TABLE [Users] ADD [MonthlyFixedCostsApprox__str] nvarchar(64) NULL;
                    UPDATE [Users]
                    SET [MonthlyFixedCostsApprox__str] = CONVERT(nvarchar(64), [MonthlyFixedCostsApprox])
                    WHERE [MonthlyFixedCostsApprox] IS NOT NULL;
                    ALTER TABLE [Users] DROP COLUMN [MonthlyFixedCostsApprox];
                    EXEC sp_rename 'Users.MonthlyFixedCostsApprox__str', 'MonthlyFixedCostsApprox', 'COLUMN';
                END
                """);
        }
    }
}
