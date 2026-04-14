import { StreamingLabPage } from "@/modules/streaming/StreamingLabPage";

/**
 * Root experience: swap `StreamingLabPage` for another module page when new simulators ship.
 */
export default function Home() {
  return <StreamingLabPage />;
}
