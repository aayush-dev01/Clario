export const dynamic = 'force-dynamic';
import "@/lib/normalize-clerk-env";
import { SignIn } from "@clerk/nextjs";
import { AuthWidgetFrame } from "@/components/auth/AuthWidgetFrame";
import { Doodle } from "@/components/ui/Doodle";

type AuthSearchParams = {
  role?: string;
};

export default function SignInPage({
  searchParams,
}: {
  searchParams?: AuthSearchParams;
}) {
  const desiredRole =
    searchParams?.role === "LEARNER" || searchParams?.role === "TEACHER"
      ? searchParams.role
      : null;
  const signUpUrl = desiredRole ? `/sign-up?role=${desiredRole}` : "/sign-up";
  const redirectUrl = "/auth/post-auth";

  return (
    <div className="w-full min-h-screen bg-warm-white flex">
      {/* Left Decorative Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col w-1/2 bg-ink p-12 lg:p-20 relative overflow-hidden shrink-0">
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <h1 className="text-3xl font-bold text-warm-white flex items-center gap-2 tracking-tight">
              <span className="w-5 h-5 text-warm-white">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <path d="M 10 2 L 10 18 M 4 6 L 16 14 M 4 14 L 16 6" />
                </svg>
              </span>
              Clario
            </h1>
            <p className="mt-4 text-warm-white/70 font-hand text-3xl max-w-sm leading-snug">
              Welcome back to real connection.
            </p>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] text-warm-white pointer-events-none">
          <Doodle
            type="circle-scribble"
            className="w-[800px] h-[800px] absolute -right-40"
          />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.15] text-warm-white pointer-events-none w-[200px]">
          <svg
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M 20 80 Q 50 10 80 80 Q 50 50 20 80" />
            <circle cx="50" cy="30" r="10" />
          </svg>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-[440px] min-h-[560px]">
          <AuthWidgetFrame>
            <SignIn
              routing="path"
              path="/sign-in"
              signUpUrl={signUpUrl}
              forceRedirectUrl={redirectUrl}
              fallbackRedirectUrl={redirectUrl}
              appearance={{
                elements: {
                  rootBox: "w-full max-w-[440px]",
                  card: "shadow-none bg-transparent rounded-2xl",
                  headerTitle: "text-ink font-bold text-3xl font-sans",
                  headerSubtitle: "text-ink-muted font-sans",
                  socialButtonsBlockButton:
                    "border-2 border-ink hover:bg-ink hover:text-warm-white transition-colors duration-200 text-ink rounded-xl h-12",
                  socialButtonsBlockButtonText: "font-semibold font-sans",
                  dividerLine: "bg-ink/10",
                  dividerText: "text-ink-muted",
                  formFieldLabel: "text-ink font-semibold",
                  formFieldInput:
                    "border-2 border-ink rounded-xl bg-transparent focus:ring-0 focus:border-ink focus:outline-none h-12 text-ink transition-all",
                  formButtonPrimary:
                    "bg-ink hover:bg-ink/90 text-warm-white rounded-xl h-12 font-semibold font-sans mt-2 transition-all",
                  footerActionText: "text-ink-muted",
                  footerActionLink: "text-ink font-bold hover:text-ink/80",
                  identityPreviewText: "text-ink font-semibold",
                  identityPreviewEditButtonIcon: "text-ink",
                },
                variables: {
                  colorPrimary: "#1A1916",
                  colorBackground: "transparent",
                  colorText: "#1A1916",
                  colorDanger: "#ff3333",
                  fontFamily: "inherit",
                  borderRadius: "0.75rem",
                },
              }}
            />
          </AuthWidgetFrame>
        </div>
      </div>
    </div>
  );
}
