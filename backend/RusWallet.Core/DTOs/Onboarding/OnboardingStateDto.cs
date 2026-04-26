namespace RusWallet.Core.DTOs.Onboarding
{
    public class OnboardingStateDto
    {
        public bool Completed { get; set; }
        public int StepIndex { get; set; }
        public string AssistantMessage { get; set; } = string.Empty;
        public UserFinancialProfilePayload? Profile { get; set; }
        public List<string>? SummaryLines { get; set; }
    }
}
