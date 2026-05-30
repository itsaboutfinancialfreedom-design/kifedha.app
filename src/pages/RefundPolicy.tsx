import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";

export default function RefundPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-base">Refund Policy</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4 text-primary">
          <RotateCcw className="w-5 h-5" />
          <span className="font-semibold text-sm">Herika rise Ltd</span>
        </div>
        <p className="text-xs text-muted-foreground mb-6">Last updated: May 30, 2026</p>

        <div className="space-y-6 text-sm text-foreground leading-relaxed">
          <section>
            <h2 className="font-display font-semibold text-base mb-2">30-Day Money-Back Guarantee</h2>
            <p className="text-muted-foreground">
              At Herika rise Ltd, we want you to be fully satisfied with your Kifedha Premium subscription. If you are not happy with your purchase for any reason, you may request a full refund within 30 days of your order date.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">How to Request a Refund</h2>
            <p className="text-muted-foreground mb-2">
              Refunds are processed by our payment provider, Paddle. You can request a refund in either of the following ways:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                Visit <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-primary underline">paddle.net</a> and follow the refund request process.
              </li>
              <li>Contact our support team through the Kifedha app, and we will facilitate the request with Paddle on your behalf.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">Refund Processing</h2>
            <p className="text-muted-foreground">
              Once your refund request is approved, Paddle will process the refund to your original payment method. Refunds typically appear within 5–10 business days, depending on your bank or card issuer.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">Exceptions</h2>
            <p className="text-muted-foreground">
              Refunds apply to subscription payments only. We do not issue partial refunds for unused portions of a billing period after the 30-day window has passed. If you cancel your subscription after the 30-day period, you will retain access until the end of your current billing cycle, and no refund will be issued.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">Trial Period</h2>
            <p className="text-muted-foreground">
              Kifedha Premium includes a 7-day free trial. You will not be charged if you cancel before the trial ends. If you continue past the trial, your subscription begins and the 30-day money-back guarantee applies from the first charge date.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-base mb-2">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Refund Policy, please contact us through the support channels available within the Kifedha app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
