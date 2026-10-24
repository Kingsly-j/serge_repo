import type { Metadata } from "next";
import { CustomerAccount } from "@/components/customer-account";

export const metadata: Metadata = {
  title: "Your Account & Messages | Anthony Mobile Homes",
  description: "Sign in to chat with the Anthony Mobile Homes team and keep your home enquiries together.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <CustomerAccount />;
}
