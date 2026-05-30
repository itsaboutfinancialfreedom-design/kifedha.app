import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-base">Privacy Policy</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4 text-primary">
          <Shield className="w-5 h-5" />
          <span className="font-semibold text-sm">Herika rise Ltd</span>
        </div>
        <p className="text-xs text-muted-foreground mb-6">Last updated: May 30, 2026</p>

        <div className="space-y-6 text-sm text-foreground leading-relaxed">
          <section>
            <h2 className="font-display font-semibold text-base mb-2">Introduction</h2>
            <p className="text-muted-foreground">
              Herika rise Ltd ("we", "us", or "our") operates the Kifedha mobile web application. We are committed to protecting your privacy and handling your personal data responsibly. This Privacy Policy explains how we collect, use, and safeguard your information.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">Data Controller</h2>
            <p className="text-muted-foreground">
              Herika rise Ltd is the data controller for the personal data collected through Kifedha. We determine the purposes and means of processing your personal data.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">What Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Account data:</strong> Name, email address, and phone number provided during registration.</li>
              <li><strong>Financial data:</strong> Income, expenses, goals, debts, and insurance details you enter into the app.</li>
              <li><strong>Usage data:</strong> App interactions, feature usage, and device information (IP address, browser type, device type).</li>
              <li><strong>Communication data:</strong> Messages exchanged with our AI financial advisor and support team.</li>
              <li><strong>Payment data:</strong> Transaction details processed by our payment provider. We do not store full payment card numbers.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>To provide and maintain the Kifedha service, including generating financial blueprints and recommendations.</li>
              <li>To process payments and manage subscriptions through our Merchant of Record.</li>
              <li>To communicate with you about your account, updates, and security alerts.</li>
              <li>To improve our services through analytics and user behavior analysis.</li>
              <li>To comply with legal obligations and prevent fraud or misuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">Legal Basis for Processing</h2>
            <p className="text-muted-foreground">
              We process your personal data based on: (1) performance of a contract (providing the Kifedha service), (2) legitimate interests (improving our services and security), (3) legal obligations, and (4) your consent (where required, such as for marketing communications).
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">Data Sharing</h2>
            <p className="text-muted-foreground mb-2">
              We share your data only with trusted third parties necessary to operate our service:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Paddle.com</strong> — Our Merchant of Record for payment processing, subscription management, tax compliance, and invoicing. Paddle processes payment-related data as an independent data controller for payment transactions.</li>
              <li><strong>Cloud hosting and infrastructure providers</strong> — To store and process your data securely.</li>
              <li><strong>Analytics providers</strong> — To understand app usage and improve user experience.</li>
              <li><strong>Professional advisers</strong> — Legal and accounting professionals, when necessary.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              We do not sell your personal data to third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your personal data for as long as your account is active or as needed to provide you with our services. Financial data is retained according to applicable accounting and tax laws. When you delete your account, we will delete or anonymise your personal data within 90 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">Your Rights</h2>
            <p className="text-muted-foreground mb-2">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten").</li>
              <li><strong>Restriction:</strong> Request limitation of how we process your data.</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests.</li>
              <li><strong>Withdraw consent:</strong> Where processing is based on consent, you may withdraw it at any time.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              To exercise these rights, contact us at the details below. We will respond within one month.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organisational measures to protect your personal data, including encryption in transit (TLS/SSL), access controls, and regular security assessments. While we strive to protect your data, no system is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">Cookies</h2>
            <p className="text-muted-foreground">
              Kifedha uses essential cookies to maintain your session and authentication state. We also use analytics cookies to understand how users interact with our app. You can manage cookie preferences through your browser settings. Essential cookies cannot be disabled as they are necessary for the app to function.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or our data practices, please contact Herika rise Ltd at the support channels available within the Kifedha app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
