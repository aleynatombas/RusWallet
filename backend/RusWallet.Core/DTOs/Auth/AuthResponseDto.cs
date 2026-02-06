namespace RusWallet.Core.DTOs.Auth
{
    public class AuthResponseDto
    {
        public int UserId { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Token { get; set; }
    }
}
