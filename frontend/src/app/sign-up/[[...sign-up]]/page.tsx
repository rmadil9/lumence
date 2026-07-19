import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <SignUp
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
