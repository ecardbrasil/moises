import DashboardClient from "@/components/DashboardClient";
import { getCandidateConfig, getElectionResults, getLocationsWithVotes, getZonas } from "@/lib/data";

export default function Home() {
  const candidate = getCandidateConfig();
  const results = getElectionResults(candidate.eleicaoAtiva);
  const locations = getLocationsWithVotes(candidate.eleicaoAtiva);
  const zonas = getZonas();

  return (
    <DashboardClient candidate={candidate} zonas={zonas} locations={locations} totalVotos={results.totalVotos} />
  );
}
