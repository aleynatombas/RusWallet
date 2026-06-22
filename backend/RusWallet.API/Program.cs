using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
using RusWallet.Infrastructure.Data;
using RusWallet.Core.Interfaces;
using RusWallet.Infrastructure.Services;
using RusWallet.Infrastructure.Security;
using RusWallet.Infrastructure.Repositories; // <- JwtService için using eklendi
using RusWallet.Infrastructure.Services.Email;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddScoped<JwtService>(); // artık doğru namespace ile referanslanıyor
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

// Yapay zeka: OpenAI ApiKey doluysa OpenAI, değilse kelime tabanlı (ücretsiz)
builder.Services.AddScoped<KeywordCategoryService>();
builder.Services.AddScoped<IAIService>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    if (!string.IsNullOrWhiteSpace(config["OpenAI:ApiKey"]?.Trim()))
        return new RusWallet.API.Services.OpenAICategoryService(config, sp.GetRequiredService<KeywordCategoryService>());
    return sp.GetRequiredService<KeywordCategoryService>();
});
// Chatbot: önce kişisel veri yanıtları; sonra OpenAI ApiKey doluysa OpenAI, değilse FAQ
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

// Fiş tarama (OCR)
builder.Services.AddScoped<IReceiptAnalysisService, ReceiptAnalysisService>();
builder.Services.AddScoped<IVoiceTransactionParser, VoiceTransactionParser>();

// --- Swagger ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "RusWallet API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT ile yetkilendirme. Önce Login ile token alın, buraya yapıştırın (Bearer öneki otomatik eklenir).",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    options.AddSecurityRequirement(document =>
    {
        var schemeRef = new OpenApiSecuritySchemeReference("Bearer", document, null);
        var requirement = new OpenApiSecurityRequirement { [schemeRef] = [] };
        return requirement;
    });
});

// --- DbContext ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// --- JWT Authentication ---
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key yapılandırması eksik.");
var key = Encoding.ASCII.GetBytes(jwtKey);
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
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// CORS: Mobil / farklı cihazdan API çağrısı için (geliştirme)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// --- Middleware ---
app.UseCors();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseAuthentication();  // JWT auth middleware
app.UseAuthorization();

app.MapControllers();

app.Run();
