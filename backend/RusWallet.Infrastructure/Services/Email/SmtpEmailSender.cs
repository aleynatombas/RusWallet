using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RusWallet.Core.Interfaces;

namespace RusWallet.Infrastructure.Services.Email;

public sealed class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var host = _configuration["Email:SmtpHost"]?.Trim();
        if (string.IsNullOrEmpty(host))
            throw new InvalidOperationException("Email:SmtpHost yapılandırılmamış.");

        var port = int.TryParse(_configuration["Email:SmtpPort"], out var p) ? p : 587;
        var user = _configuration["Email:SmtpUser"] ?? "";
        var password = _configuration["Email:SmtpPassword"] ?? "";
        var fromAddress = _configuration["Email:FromAddress"]?.Trim();
        var fromName = _configuration["Email:FromName"] ?? "RusWallet";

        if (string.IsNullOrEmpty(fromAddress))
            fromAddress = user;

        if (string.IsNullOrEmpty(fromAddress))
            throw new InvalidOperationException("Email:FromAddress veya Email:SmtpUser gerekli.");

        using var message = new MailMessage
        {
            From = new MailAddress(fromAddress, fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(to);

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(user, password),
        };

        await client.SendMailAsync(message, cancellationToken);
        _logger.LogInformation("E-posta gönderildi: {To}, {Subject}", to, subject);
    }
}
