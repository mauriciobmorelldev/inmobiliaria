"use client";

import dynamic from "next/dynamic";

const HomeStitch = dynamic(() => import("@/components/inmo/HomeStitch"), {
  ssr: false,
});

export default function HomePage() {
  return <HomeStitch />;
}
