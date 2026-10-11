using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RusWallet.Infrastructure.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// FixUserMonthlyFinancialColumnTypes (10.) ve FixFinancialDecimalColumnTypes (11.) migration'ları,
    /// EncryptFinancialFields (9.) migration'ının nvarchar(1024) dönüşümünü yanlışlıkla decimal(18,2)'ye
    /// geri çevirmişti — bu, AES şifreli metin yazılırken SQL Error 8115'e (arithmetic overflow) yol
    /// açıyordu. Bu migration, ilgili 7 kolonu standart ALTER COLUMN ile tekrar nvarchar(1024) yapar;
    /// SQL Server mevcut değerleri CAST ile metne çevirir, satır kaybı olmaz.
    /// </summary>
    public partial class RestoreEncryptedFinancialColumnTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "MonthlyIncomeNet",
                table: "Users",
                type: "nvarchar(1024)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "MonthlyFixedCostsApprox",
                table: "Users",
                type: "nvarchar(1024)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Amount",
                table: "Transactions",
                type: "nvarchar(1024)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<string>(
                name: "TotalIncome",
                table: "FinanceSummaries",
                type: "nvarchar(1024)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<string>(
                name: "TotalExpense",
                table: "FinanceSummaries",
                type: "nvarchar(1024)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<string>(
                name: "Balance",
                table: "FinanceSummaries",
                type: "nvarchar(1024)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<string>(
                name: "PredictedAmount",
                table: "Predictions",
                type: "nvarchar(1024)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Not: Up() sonrasi yeni yazilan degerler AES sifreli metin olacagindan, bu geri alma
            // sifreli veri varken calistirilirsa ayni 8115 hatasini tekrar uretir. Yalnizca Up()
            // henuz gercek veri yazilmadan once iptal edilmek istenirse guvenlidir.
            migrationBuilder.AlterColumn<decimal>(
                name: "MonthlyIncomeNet",
                table: "Users",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1024)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "MonthlyFixedCostsApprox",
                table: "Users",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1024)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Amount",
                table: "Transactions",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(1024)");

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalIncome",
                table: "FinanceSummaries",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(1024)");

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalExpense",
                table: "FinanceSummaries",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(1024)");

            migrationBuilder.AlterColumn<decimal>(
                name: "Balance",
                table: "FinanceSummaries",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(1024)");

            migrationBuilder.AlterColumn<decimal>(
                name: "PredictedAmount",
                table: "Predictions",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(1024)");
        }
    }
}
