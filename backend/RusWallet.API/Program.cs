using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using RusWallet.Infrastructure.Data;
using RusWallet.Core.Interfaces;
using RusWallet.Infrastructure.Services;
using RusWallet.Infrastructure.Security; // <- JwtService için using eklendi

var builder = WebApplication.CreateBuilder(args);

// --- Services ---
// Service ve Repository bağımlılıklarını ekliyoruz
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<JwtService>(); // artık doğru namespace ile referanslanıyor
builder.Services.AddControllers();
builder.Services.AddScoped<IFinanceAnalysisService, FinanceAnalysisService>();
builder.Services.AddScoped<IPredictionService, PredictionService>();

// --- Swagger ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- DbContext ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// --- JWT Authentication ---
var key = Encoding.ASCII.GetBytes(builder.Configuration["Jwt:Secret"]);
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
