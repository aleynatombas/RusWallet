using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RusWallet.Infrastructure.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// EncryptFinancialFields vb. migration sonrası Amount / özet / tahmin kolonları nvarchar kalmış olabilir.
    /// </summary>
    public partial class FixFinancialDecimalColumnTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            ConvertNvarcharMoneyColumn(migrationBuilder, "Transactions", "Amount", notNull: true);
            ConvertNvarcharMoneyColumn(migrationBuilder, "FinanceSummaries", "TotalIncome", notNull: true);
            ConvertNvarcharMoneyColumn(migrationBuilder, "FinanceSummaries", "TotalExpense", notNull: true);
            ConvertNvarcharMoneyColumn(migrationBuilder, "FinanceSummaries", "Balance", notNull: true);
            ConvertNvarcharMoneyColumn(migrationBuilder, "Predictions", "PredictedAmount", notNull: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            RevertDecimalMoneyColumn(migrationBuilder, "Transactions", "Amount");
            RevertDecimalMoneyColumn(migrationBuilder, "FinanceSummaries", "TotalIncome");
            RevertDecimalMoneyColumn(migrationBuilder, "FinanceSummaries", "TotalExpense");
            RevertDecimalMoneyColumn(migrationBuilder, "FinanceSummaries", "Balance");
            RevertDecimalMoneyColumn(migrationBuilder, "Predictions", "PredictedAmount");
        }

        private static void ConvertNvarcharMoneyColumn(
            MigrationBuilder migrationBuilder,
            string table,
            string column,
            bool notNull)
        {
            var temp = $"{column}__dec";
            var objectName = $"dbo.{table}";
            var qualified = $"[{table}]";

            migrationBuilder.Sql(
                $"""
                IF COL_LENGTH('{objectName}', '{column}') IS NOT NULL
                   AND EXISTS (
                       SELECT 1 FROM sys.columns c
                       JOIN sys.types t ON c.user_type_id = t.user_type_id
                       WHERE c.object_id = OBJECT_ID('{objectName}') AND c.name = '{column}'
                         AND t.name IN ('nvarchar', 'varchar', 'nchar', 'char'))
                    ALTER TABLE {qualified} ADD [{temp}] decimal(18, 2) NULL;
                """);

            migrationBuilder.Sql(
                $"""
                IF COL_LENGTH('{objectName}', '{temp}') IS NOT NULL
                    UPDATE {qualified}
                    SET [{temp}] = ISNULL(TRY_CONVERT(
                        decimal(18, 2),
                        REPLACE(REPLACE(LTRIM(RTRIM([{column}])), ',', '.'), ' ', '')), 0);
                """);

            if (notNull)
            {
                migrationBuilder.Sql(
                    $"""
                    IF COL_LENGTH('{objectName}', '{temp}') IS NOT NULL
                        UPDATE {qualified} SET [{temp}] = 0 WHERE [{temp}] IS NULL;
                    """);
            }

            migrationBuilder.Sql(
                $"""
                IF COL_LENGTH('{objectName}', '{temp}') IS NOT NULL
                BEGIN
                    ALTER TABLE {qualified} DROP COLUMN [{column}];
                    EXEC sp_rename '{table}.{temp}', '{column}', 'COLUMN';
                END
                """);

            if (notNull)
            {
                migrationBuilder.Sql(
                    $"""
                    IF COL_LENGTH('{objectName}', '{column}') IS NOT NULL
                       AND EXISTS (
                           SELECT 1 FROM sys.columns c
                           JOIN sys.types t ON c.user_type_id = t.user_type_id
                           WHERE c.object_id = OBJECT_ID('{objectName}') AND c.name = '{column}' AND t.name = 'decimal')
                        ALTER TABLE {qualified} ALTER COLUMN [{column}] decimal(18, 2) NOT NULL;
                    """);
            }
        }

        private static void RevertDecimalMoneyColumn(MigrationBuilder migrationBuilder, string table, string column)
        {
            var temp = $"{column}__str";
            var objectName = $"dbo.{table}";
            var qualified = $"[{table}]";

            migrationBuilder.Sql(
                $"""
                IF COL_LENGTH('{objectName}', '{column}') IS NOT NULL
                   AND EXISTS (
                       SELECT 1 FROM sys.columns c
                       JOIN sys.types t ON c.user_type_id = t.user_type_id
                       WHERE c.object_id = OBJECT_ID('{objectName}') AND c.name = '{column}' AND t.name = 'decimal')
                    ALTER TABLE {qualified} ADD [{temp}] nvarchar(64) NULL;
                """);

            migrationBuilder.Sql(
                $"""
                IF COL_LENGTH('{objectName}', '{temp}') IS NOT NULL
                    UPDATE {qualified}
                    SET [{temp}] = CONVERT(nvarchar(64), [{column}]);
                """);

            migrationBuilder.Sql(
                $"""
                IF COL_LENGTH('{objectName}', '{temp}') IS NOT NULL
                BEGIN
                    ALTER TABLE {qualified} DROP COLUMN [{column}];
                    EXEC sp_rename '{table}.{temp}', '{column}', 'COLUMN';
                END
                """);
        }
    }
}
