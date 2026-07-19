import { SignIn } from "@clerk/nextjs";

// Clerk's variables-only theming: the granular `elements` key set is
// version-specific and this Clerk major loosened its appearance types to
// `any`, so pixel-matching the mockup's bespoke 3-button card is deferred to
// the Phase 5 polish pass, once the rendered DOM can be inspected directly.
export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#B5522F",
            colorBackground: "#FFFFFF",
            colorForeground: "#1A1A18",
            colorMutedForeground: "#6B6A65",
            borderRadius: "8px",
            fontFamily: "var(--font-geist-sans)",
          },
        }}
      />
    </div>
  );
}
