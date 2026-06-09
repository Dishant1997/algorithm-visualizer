"use client";

import { useState } from "react";

import { ModuleSelector, type ModuleId } from "@/components/layout/module-selector";
import { KMeansLabPage } from "@/modules/kmeans/KMeansLabPage";
import { StreamingLabPage } from "@/modules/streaming/StreamingLabPage";

export function ModuleRouter() {
  const [activeModule, setActiveModule] = useState<ModuleId>("kmeans");

  const nav = (
    <ModuleSelector activeModule={activeModule} onChange={setActiveModule} />
  );

  if (activeModule === "streaming") {
    return <StreamingLabPage headerActions={nav} />;
  }
  return <KMeansLabPage headerActions={nav} />;
}
