import IncomeAllocator from "@/components/IncomeAllocator";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ExportPDF } from "@/components/ExportPDF";

export default function IncomeAllocatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
          <h1 className="font-display font-bold text-lg">Financial Blueprint</h1>
          <span />
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-2xl font-bold">Your Financial Blueprint</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Get a personalized income allocation based on your situation. Adjust inputs to see real-time changes.
            </p>
          </div>
          <ExportPDF variant="compact" />
        </div>
        <IncomeAllocator />
      </main>
    </div>
  );
}

