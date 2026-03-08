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

var builder = WebApplication.CreateBuilder(args);

// --- Services ---
// Service ve Repository bağımlılıklarını ekliyoruz
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<JwtService>(); // artık doğru namespace ile referanslanıyor
builder.Services.AddControllers();
builder.Services.AddScoped<IFinanceAnalysisService, FinanceAnalysisService>();
builder.Services.AddScoped<IFinanceMLService, FinanceMLService>();
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
// Chatbot: OpenAI ApiKey doluysa OpenAI, değilse FAQ (kelime tabanlı)
builder.Services.AddScoped<FAQChatbotService>();
builder.Services.AddScoped<IChatbotService>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    if (!string.IsNullOrWhiteSpace(config["OpenAI:ApiKey"]?.Trim()))
        return new RusWallet.API.Services.OpenAIChatbotService(config, sp.GetRequiredService<FAQChatbotService>());
    return sp.GetRequiredService<FAQChatbotService>();
});

// Fiş tarama (OCR)
builder.Services.AddScoped<IReceiptAnalysisService, ReceiptAnalysisService>();

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

var app = builder.Build();

// --- Middleware ---
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseAuthentication();  // JWT auth middleware
app.UseAuthorization();

app.MapControllers();

app.Run();
