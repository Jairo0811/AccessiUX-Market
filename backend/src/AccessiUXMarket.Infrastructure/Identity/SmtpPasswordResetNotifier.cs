using System.Net;
using System.Net.Mail;
using AccessiUXMarket.Application.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AccessiUXMarket.Infrastructure.Identity;

internal sealed class SmtpPasswordResetNotifier(
    IOptions<SmtpOptions> smtpOptions,
    IOptions<PasswordResetOptions> resetOptions,
    ILogger<SmtpPasswordResetNotifier> logger) : IPasswordResetNotifier
{
    private readonly SmtpOptions _smtp = smtpOptions.Value;
    private readonly PasswordResetOptions _reset = resetOptions.Value;

    public async Task SendAsync(
        string recipientEmail,
        string resetToken,
        CancellationToken cancellationToken)
    {
        if (!_smtp.Enabled)
        {
            logger.LogWarning("Password reset email delivery is disabled. Configure Smtp settings before production use.");
            return;
        }

        var resetUrl = $"{_reset.FrontendUrl}?email={Uri.EscapeDataString(recipientEmail)}&token={Uri.EscapeDataString(resetToken)}";
        using var message = new MailMessage
        {
            From = new MailAddress(_smtp.FromAddress, _smtp.FromName),
            Subject = "Restablece tu contraseña de AccessiUX Market",
            Body = $"Abre este enlace para restablecer tu contraseña: {resetUrl}",
            IsBodyHtml = false
        };
        message.To.Add(recipientEmail);

        using var client = new SmtpClient(_smtp.Host, _smtp.Port)
        {
            EnableSsl = _smtp.EnableSsl
        };

        if (!string.IsNullOrWhiteSpace(_smtp.UserName))
        {
            client.Credentials = new NetworkCredential(_smtp.UserName, _smtp.Password);
        }

        await client.SendMailAsync(message, cancellationToken);
    }
}
