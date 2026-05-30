import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-base">Terms of Service</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4 text-primary">
          <FileText className="w-5 h-5" />
          <span className="font-semibold text-sm">Herika rise Ltd</span>
        </div>
        <p className="text-xs text-muted-foreground mb-6">Last updated: May 30, 2026</p>

        <div className="space-y-6 text-sm text-foreground leading-relaxed">
          <section>
            <h2 className="font-display font-semibold text-base mb-2">1. Agreement to Terms</h2>
            <p className="text-muted-foreground">
              These Terms of Service ("Terms") govern your access to and use of the Kifedha mobile web application and services (collectively, the "Service") provided by Herika rise Ltd ("we", "us", or "our"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Kifedha is a personal financial planning tool that helps users track income and expenses, set savings goals, plan debt repayment, calculate insurance coverage gaps, and receive AI-powered financial guidance. The Service is provided on a software-as-a-service basis.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">3. No Financial Advice Disclaimer</h2>
            <p className="text-muted-foreground">
              The information and recommendations provided through Kifedha are for general educational and informational purposes only. They do not constitute financial, investment, legal, or tax advice. You are solely responsible for your financial decisions. We recommend consulting a qualified professional before making significant financial commitments.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">4. AI-Generated Content</h2>
            <p className="text-muted-foreground">
              Kifedha uses artificial intelligence to generate financial insights and recommendations. AI outputs may be inaccurate, incomplete, or unsuitable for your specific circumstances. You are responsible for verifying the accuracy of AI-generated content and for how you use it. Do not use Kifedha AI outputs for regulated professional advice without appropriate human oversight.
            </p>
            <p className="text-muted-foreground mt-2">
              You agree not to use the AI features to generate illegal content, deepfakes, hate speech, malware, or to attempt jailbreaking or circumventing the system's safeguards. We reserve the right to review, filter, or remove AI-generated content and suspend accounts for prohibited use.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">5. User Accounts and Security</h2>
            <p className="text-muted-foreground">
              You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must immediately notify us of any unauthorised use of your account.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">6. Acceptable Use</h2>
            <p className="text-muted-foreground mb-2">
              You agree not to misuse the Service, including but not limited to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Using the Service for any unlawful purpose or in violation of any applicable law.</li>
              <li>Engaging in fraud, spam, or deceptive practices.</li>
              <li>Infringing intellectual property rights or other proprietary rights.</li>
              <li>Attempting to interfere with the security or availability of the Service, including through malware, probing, or scraping.</li>
              <li>Reverse engineering, decompiling, or attempting to extract source code.</li>
              <li>Reselling, redistributing, or sublicensing access to the Service.</li>
              <li>Circumventing any technical limits or restrictions we impose.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">7. Intellectual Property</h2>
            <p className="text-muted-foreground">
              Herika rise Ltd retains all ownership rights in the Service, including software, documentation, branding, and content. We grant you a limited, non-exclusive, non-transferable licence to use the Service within the scope of your selected plan. All rights not expressly granted are reserved.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">8. Payment and Subscriptions</h2>
            <p className="text-muted-foreground">
              Kifedha offers both free and premium subscription plans. All payments are processed by our online reseller, Paddle.com. Paddle.com is the Merchant of Record for all our orders and provides all customer service inquiries related to payments, billing, tax, cancellations, and refunds. For full details on payment terms, billing, tax, cancellation, and refund mechanics, please refer to Paddle's Buyer Terms at <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">https://www.paddle.com/legal/checkout-buyer-terms</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">9. Service Level</h2>
            <p className="text-muted-foreground">
              We strive to provide a reliable and high-quality Service, but we do not guarantee that the Service will be uninterrupted, timely, secure, or error-free. The Service is provided "as is" and "as available" without warranties of any kind, either express or implied.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">10. Termination and Suspension</h2>
            <p className="text-muted-foreground">
              We may suspend or terminate your access to the Service for material breach of these Terms, non-payment, security or fraud risk, or repeated or serious policy violations. Upon termination, your right to use the Service ceases immediately. You may also delete your account at any time through the app settings.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">11. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the fullest extent permitted by law, Herika rise Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of the Service. Our aggregate liability shall be limited to the fees you paid to us in the six months preceding the claim. Nothing in these Terms excludes or limits liability for fraud, death, or personal injury where required by law.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">12. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update these Terms from time to time. We will notify you of material changes through the app or by email. Your continued use of the Service after such changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">13. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Herika rise Ltd is registered, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">14. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, please contact us through the support channels available within the Kifedha app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
