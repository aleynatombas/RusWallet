using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RusWallet.Core.Interfaces;

namespace RusWallet.Infrastructure.Services.Email;

/// <summary>SMTP yapılandırılmadığında e-postayı loglar; geliştirme ve test için.</summary>
public sealed class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;
    private readonly IConfiguration _configuration;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var baseUrl = (_configuration["App:PublicWebBaseUrl"] ?? "").TrimEnd('/');
        _logger.LogWarning(
            "E-posta gönderimi (SMTP kapalı — gerçek posta kutusuna düşmez). Alıcı: {To}, Konu: {Subject}. BaseUrl: {BaseUrl}.",
            to, subject, baseUrl);
        _logger.LogInformation("E-posta HTML: {Html}", htmlBody);
        return Task.CompletedTask;
    }
}
