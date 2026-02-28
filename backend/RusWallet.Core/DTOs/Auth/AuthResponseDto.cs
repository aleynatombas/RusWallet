namespace RusWallet.Core.DTOs.Auth
{
    public class AuthResponseDto
    {
        public int UserId { get; set; }
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Token { get; set; }
    }
}
