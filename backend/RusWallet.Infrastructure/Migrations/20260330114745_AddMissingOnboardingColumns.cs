using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RusWallet.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingOnboardingColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.Users', 'FinancialProfileJson') IS NULL
                      ALTER TABLE [Users] ADD [FinancialProfileJson] nvarchar(max) NULL;
                  IF COL_LENGTH('dbo.Users', 'OnboardingCompletedAt') IS NULL
                      ALTER TABLE [Users] ADD [OnboardingCompletedAt] datetime2 NULL;
                  IF COL_LENGTH('dbo.Users', 'OnboardingStepIndex') IS NULL
                      ALTER TABLE [Users] ADD [OnboardingStepIndex] int NOT NULL CONSTRAINT DF_Users_OnboardingStepIndex DEFAULT(0);");

            migrationBuilder.Sql(
                @"UPDATE [Users]
                  SET [OnboardingCompletedAt] = COALESCE([OnboardingCompletedAt], SYSUTCDATETIME()),
                      [FinancialProfileJson] = CASE
                          WHEN [FinancialProfileJson] IS NULL OR LTRIM(RTRIM([FinancialProfileJson])) = '' THEN '{}'
                          ELSE [FinancialProfileJson]
                      END
                  WHERE [OnboardingCompletedAt] IS NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("IF COL_LENGTH('dbo.Users', 'FinancialProfileJson') IS NOT NULL ALTER TABLE [Users] DROP COLUMN [FinancialProfileJson];");
            migrationBuilder.Sql("IF COL_LENGTH('dbo.Users', 'OnboardingCompletedAt') IS NOT NULL ALTER TABLE [Users] DROP COLUMN [OnboardingCompletedAt];");
            migrationBuilder.Sql(
                @"IF COL_LENGTH('dbo.Users', 'OnboardingStepIndex') IS NOT NULL
                  BEGIN
                      DECLARE @df NVARCHAR(128);
                      SELECT @df = dc.name
                      FROM sys.default_constraints dc
                      INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
                      WHERE c.object_id = OBJECT_ID('dbo.Users') AND c.name = 'OnboardingStepIndex';
                      IF @df IS NOT NULL EXEC('ALTER TABLE [Users] DROP CONSTRAINT [' + @df + '];');
                      ALTER TABLE [Users] DROP COLUMN [OnboardingStepIndex];
                  END;");
        }
    }
}
