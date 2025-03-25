import WorkReportPage from "./WorkReportPage";
import { Navigation } from "./Navigation";

function Home() {
  return (
    <div className="w-screen h-screen relative">
      <Navigation />
      <div className="p-4">
        <WorkReportPage />
      </div>
    </div>
  );
}

export default Home;
