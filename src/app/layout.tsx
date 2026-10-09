import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = { title: "LinkedIn Hook Grader | Myntmore Demo", description: "Score the first two lines of a LinkedIn post and explore three rewrites." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
