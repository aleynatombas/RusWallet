using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
using RusWallet.Infrastructure.Data;
using RusWallet.Core.Interfaces;
using RusWallet.Infrastructure.Services;
using RusWallet.Infrastructure.Security;
using RusWallet.Infrastructure.Repositories;
using RusWallet.Infrastructure.Services.Email;
using Microsoft.Extensions.Logging;
using RusWallet.API.Middleware;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);

ValidateProductionConfiguration(builder.Configuration, builder.Environment);

// ── Finansal alan şifreleme — AES-256 servisi başlatılıyor ──────────────────
var encryptionKey = builder.Configuration["Encryption:Key"]
    ?? throw new InvalidOperationException("Encryption:Key appsettings'te tanımlanmamış.");
FieldEncryptionService.Initialize(encryptionKey);
// ────────────────────────────────────────────────────────────────────────────

// --- Services ---
// Service ve Repository bağımlılıklarını ekliyoruz
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IOnboardingService, OnboardingService>();
builder.Services.AddScoped<IEmailSender>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    if (!string.IsNullOrWhiteSpace(config["Email:SmtpHost"]?.Trim()))
        return new SmtpEmailSender(config, sp.GetRequiredService<ILogger<SmtpEmailSender>>());
    return new LoggingEmailSender(sp.GetRequiredService<ILogger<LoggingEmailSender>>(), config);
});
builder.Services.AddScoped<JwtService>();
builder.Services.AddControllers();
builder.Services.AddScoped<IFinanceAnalysisService, FinanceAnalysisService>();
builder.Services.AddScoped<IFinanceMLService, FinanceMLService>();
builder.Services.AddScoped<IMonthEndPredictiveService, MonthEndPredictiveService>();
builder.Services.AddScoped<RuleBasedCockpitMonthEndInsightService>();
builder.Services.AddScoped<ICockpitMonthEndInsightService>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var fallback = sp.GetRequiredService<RuleBasedCockpitMonthEndInsightService>();
    if (!string.IsNullOrWhiteSpace(config["OpenAI:ApiKey"]?.Trim()))
        return new RusWallet.API.Services.OpenAICockpitMonthEndInsightService(config, fallback);
    return fallback;
});
builder.Services.AddScoped<IAnalysisRoadmapService, AnalysisRoadmapService>();

builder.Services.AddScoped<IPredictionService, PredictionService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IFinanceSummaryRepository, FinanceSummaryRepository>();
builder.Services.AddScoped<IPredictionRepository, PredictionRepository>();

builder.Services.AddScoped<KeywordCategoryService>();
builder.Services.AddScoped<IAIService>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    if (!string.IsNullOrWhiteSpace(config["OpenAI:ApiKey"]?.Trim()))
        return new RusWallet.API.Services.OpenAICategoryService(config, sp.GetRequiredService<KeywordCategoryService>());
    return sp.GetRequiredService<KeywordCategoryService>();
});
builder.Services.AddScoped<IPersonalizedChatAnswerService, PersonalizedChatAnswerService>();
builder.Services.AddScoped<IChatUserFinancialContext, ChatUserFinancialContext>();
builder.Services.AddScoped<FAQChatbotService>();
builder.Services.AddScoped<IChatbotService>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    IChatbotService inner = !string.IsNullOrWhiteSpace(config["OpenAI:ApiKey"]?.Trim())
        ? new RusWallet.API.Services.OpenAIChatbotService(
            config,
            sp.GetRequiredService<FAQChatbotService>(),
            sp.GetRequiredService<IChatUserFinancialContext>())
        : sp.GetRequiredService<FAQChatbotService>();
    return new RusWallet.API.Services.PersonalizedChatbotService(
        sp.GetRequiredService<IPersonalizedChatAnswerService>(),
        inner);
});

builder.Services.AddScoped<IReceiptAnalysisService, ReceiptAnalysisService>();
builder.Services.AddScoped<IVoiceTransactionParser, VoiceTransactionParser>();

var enableSwagger = builder.Configuration.GetValue("Features:EnableSwagger", builder.Environment.IsDevelopment());
if (enableSwagger)
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo { Title = "RusWallet API", Version = "v1" });
        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT ile yetkilendirme.",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
        });
        options.AddSecurityRequirement(document =>
        {
            var schemeRef = new OpenApiSecuritySchemeReference("Bearer", document, null);
            return new OpenApiSecurityRequirement { [schemeRef] = [] };
        });
    });
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database");

var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key yapılandırması eksik.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer yapılandırması eksik.");
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt:Audience yapılandırması eksik.");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = signingKey,
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
    };
});

builder.Services.AddAuthorization();

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (corsOrigins.Length > 0)
        {
            policy.WithOrigins(corsOrigins)
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        }
        else if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(_ => true)
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        }
    });
});

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();

if (enableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        if (report.Status != HealthStatus.Healthy)
        {
            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            foreach (var entry in report.Entries)
            {
                if (entry.Value.Status == HealthStatus.Healthy) continue;
                var ex = entry.Value.Exception;
                var sqlNumber = (ex as SqlException)?.Number ?? (ex?.InnerException as SqlException)?.Number;
                // Yalnızca istisna türü ve SQL hata numarası loglanır; bağlantı dizesi,
                // şifre veya ham exception mesajı (parola içerebilir) kesinlikle yazılmaz.
                logger.LogError(
                    "Health check {Name} durumu {Status}. İstisna türü: {ExceptionType}. SqlException.Number: {SqlErrorNumber}",
                    entry.Key, entry.Value.Status, ex?.GetType().Name ?? "yok", sqlNumber?.ToString() ?? "yok");
            }
        }
        context.Response.ContentType = "text/plain";
        await context.Response.WriteAsync(report.Status.ToString());
    },
});
app.MapControllers();

if (builder.Configuration.GetValue("Database:ApplyMigrationsOnStartup", false))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.Run();

static void ValidateProductionConfiguration(IConfiguration config, IHostEnvironment env)
{
    if (!env.IsProduction()) return;

    var key = config["Jwt:Key"] ?? "";
    const string devKeyMarker = "BuCokGizliVeUzunBirKey";
    if (key.Contains(devKeyMarker, StringComparison.Ordinal) || key.Length < 32)
        throw new InvalidOperationException(
            "Production ortamında Jwt:Key en az 32 karakter olmalı ve geliştirme anahtarı kullanılmamalı. Ortam değişkeni veya User Secrets kullanın.");

    var origins = config.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
    if (origins.Length == 0 || origins.All(string.IsNullOrWhiteSpace))
        throw new InvalidOperationException(
            "Production ortamında Cors:AllowedOrigins en az bir web origin içermeli (örn. https://app.alanadiniz.com).");

    if (string.IsNullOrWhiteSpace(config.GetConnectionString("DefaultConnection")))
        throw new InvalidOperationException("Production ortamında ConnectionStrings:DefaultConnection zorunludur.");
}
