import { BookOpen, ExternalLink, FileText, PlayCircle } from "lucide-react";

const archive = "/research/";

const primaryReading = [
  {
    title: "El Niño 2026–27 Watch",
    description:
      "The complete legacy research overview: situation analysis, regional impacts, funding, preparedness, map ideas, and source notes.",
    href: `${archive}legacy-overview.html`,
    icon: BookOpen,
  },
  {
    title: "Shared resource index",
    description:
      "Links collected by the Super El Niño response group, grouped by science, preparedness, networks, mutual aid, tools, and logistics.",
    href: `${archive}resources.md`,
    icon: FileText,
  },
  {
    title: "El Niño Research Plan",
    description:
      "The group’s full research plan in its preserved plain-text form.",
    href: `${archive}el-nino-research-plan.txt`,
    icon: FileText,
  },
  {
    title: "Deep-research prompt",
    description:
      "The reusable prompt previously used to guide the project’s deep-research work.",
    href: `${archive}deep-research-prompt.md`,
    icon: FileText,
  },
];

const videoBriefs = [
  ["Why El Niño 2026 has scientists worried", "BBC News · The Global Story", "Ou5wECGoStc.md"],
  ["This El Niño Is About To Cause a Global Catastrophe", "The World, The Universe And Us", "KxNHlkNuqG0.md"],
  ["ClimateWatch: El Niño strengthens, October update", "WeatherWatchTV", "7oupDKBxs-I.md"],
] as const;

export default function ResearchLibrary() {
  return (
    <section className="research-library" aria-labelledby="research-title">
      <div className="research-intro">
        <span className="section-kicker">Legacy research library</span>
        <h2 id="research-title">Research & preparedness resources</h2>
        <p>
          The previous El Niño Watch has been preserved here alongside the
          community map. These are research records and links, not live
          official alerts—check local authorities for current guidance.
        </p>
      </div>

      <div className="research-grid">
        {primaryReading.map(({ title, description, href, icon: Icon }) => (
          <a className="research-card" href={href} target="_blank" rel="noreferrer" key={href}>
            <Icon size={22} aria-hidden="true" />
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <ExternalLink size={17} aria-label={`Open ${title}`} />
          </a>
        ))}
      </div>

      <section className="video-briefs" aria-labelledby="video-briefs-title">
        <h3 id="video-briefs-title">Video research briefs</h3>
        <div className="research-grid">
          {videoBriefs.map(([title, source, filename]) => (
            <a className="research-card" href={`${archive}videos/${filename}`} target="_blank" rel="noreferrer" key={filename}>
              <PlayCircle size={22} aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{source} · preserved transcript and notes</p>
              </div>
              <ExternalLink size={17} aria-label={`Open ${title}`} />
            </a>
          ))}
        </div>
      </section>
    </section>
  );
}
