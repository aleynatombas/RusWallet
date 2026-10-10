using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RusWallet.Infrastructure.Migrations
{
    public partial class AddRefreshTokenToUser : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('dbo.Users', 'RefreshTokenHash') IS NULL
                    ALTER TABLE [Users] ADD [RefreshTokenHash] nvarchar(128) NULL;
                IF COL_LENGTH('dbo.Users', 'RefreshTokenExpiresUtc') IS NULL
                    ALTER TABLE [Users] ADD [RefreshTokenExpiresUtc] datetime2 NULL;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('dbo.Users', 'RefreshTokenHash') IS NOT NULL
                    ALTER TABLE [Users] DROP COLUMN [RefreshTokenHash];
                IF COL_LENGTH('dbo.Users', 'RefreshTokenExpiresUtc') IS NOT NULL
                    ALTER TABLE [Users] DROP COLUMN [RefreshTokenExpiresUtc];
                """);
        }
    }
}
