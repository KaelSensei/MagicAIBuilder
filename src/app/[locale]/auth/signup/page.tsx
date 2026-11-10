import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  // SignUpForm reads `callbackUrl` with useSearchParams, which needs a
  // Suspense boundary to keep the page statically renderable.
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
