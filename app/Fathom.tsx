"use client";
import { load, trackPageview } from "fathom-client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const Fathom = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    load("FSLAOVYH", {
      includedDomains: ["build.wikihouse.cc"],
    });
  }, []);

  useEffect(() => {
    trackPageview();
    // Record a pageview when route changes
  }, [pathname, searchParams]);
  return null;
};

export default Fathom;
