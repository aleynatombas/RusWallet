namespace RusWallet.Core.DTOs.Onboarding
{
    public class OnboardingAnswerResponseDto
    {
        public string AssistantReply { get; set; } = string.Empty;
        public bool Completed { get; set; }
        public int NextStepIndex { get; set; }
        public UserFinancialProfilePayload? Profile { get; set; }
        public List<string>? SummaryLines { get; set; }
        public string? AssistantMessageFollowUp { get; set; }
    }
}
