import { useState } from "react";
import { useResearchDashboard } from "@/lib/queries";
import { CardShell, EmptyState, PageHeader, StatCard } from "@/components/kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/lib/recharts";

type Section = "prelims" | "mains" | "coverage" | "current";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "prelims", label: "Prelims analysis" },
  { id: "mains", label: "Mains trend" },
  { id: "coverage", label: "Subjects & schedule" },
  { id: "current", label: "Current research" },
];

export default function Research() {
  const query = useResearchDashboard();
  const [section, setSection] = useState<Section>("prelims");
  const [prelimsSubject, setPrelimsSubject] = useState("Economy");
  const [mainsPaper, setMainsPaper] = useState("GS-I");
  const [mainsYear, setMainsYear] = useState(2026);
  const [recurrenceSearch, setRecurrenceSearch] = useState("");
  const [scheduleSubject, setScheduleSubject] = useState("all");
  const data = query.data;

  if (query.isPending) {
    return <div className="mx-auto max-w-7xl space-y-4 px-4 py-8"><div className="h-10 w-64 animate-pulse rounded bg-[#F0EDE5]" /><div className="h-64 animate-pulse rounded-xl bg-[#F0EDE5]" /></div>;
  }

  if (query.isError || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <EmptyState
          icon={<span className="font-mono text-xl">R</span>}
          title="Research data unavailable"
          hint="Check the Vercel/Railway deployment bundle includes backend/data/research, then retry the page."
          testId="research-error-state"
        />
      </div>
    );
  }

  const prelimSubjects = Object.keys(data.prelims.subject_by_year[0] ?? {}).filter((key) => key !== "year");
  const selectedPrelimsSubject = prelimSubjects.includes(prelimsSubject) ? prelimsSubject : (prelimSubjects[0] ?? "");
  const prelimSeries = data.prelims.subject_by_year.map((row) => ({
    year: Number(row.year),
    questions: Number(row[selectedPrelimsSubject] ?? 0),
  }));
  const recurrence = [...data.prelims.subtopic_recurrence]
    .sort((a, b) => Number(b.unique_years) - Number(a.unique_years) || Number(b.question_count) - Number(a.question_count))
    .filter((row) => row.subtopic.toLowerCase().includes(recurrenceSearch.trim().toLowerCase()));
  const mainsRows = data.mains.rows
    .filter((row) => row.paper === mainsPaper)
    .map((row) => ({ ...row, selectedMarks: row.marks[String(mainsYear)] }))
    .sort((a, b) => (b.selectedMarks ?? -1) - (a.selectedMarks ?? -1));
  const mainsSubjects = data.weightage.subjects.filter((subject) => subject.gs === mainsPaper);
  const scheduleSubjects = [...new Set(data.schedule.papers.map((paper) => String(paper["Core Subject"] ?? "Other")))];
  const allTests = [...data.schedule.papers]
    .filter((paper) => scheduleSubject === "all" || String(paper["Core Subject"] ?? "Other") === scheduleSubject)
    .sort((a, b) => String(a.Date ?? "").localeCompare(String(b.Date ?? "")));
  const weightageRows = [...data.weightage.subjects].sort((a, b) => a.gs.localeCompare(b.gs) || a.subject.localeCompare(b.subject));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        overline="Research library · source-tagged"
        title="UPSC Research & Trends"
        description="Prelims classification, supplied Mains trend tables, topic recurrence, and source coverage. Research tags are estimates, not UPSC disclosures."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Prelims questions" value={data.coverage.prelims_questions.toLocaleString()} sub={data.coverage.prelims_years} testId="research-prelims-stat" />
        <StatCard label="Mains topic rows" value={data.coverage.mains_topic_rows} sub={`${data.coverage.mains_years[0]}–${data.coverage.mains_years.at(-1)} · GS I–IV`} testId="research-mains-stat" accent />
        <StatCard label="Recurring topics" value={data.prelims.subtopic_recurrence.length} sub="classified subtopics" testId="research-recurrence-stat" />
        <StatCard label="Subjects catalogued" value={data.coverage.taxonomy_subjects} sub="Prelims, Mains and cross-cutting" testId="research-subject-stat" />
      </div>

      <div className="flex overflow-x-auto rounded-lg border border-[#E8E3D7] bg-white p-1" role="tablist" aria-label="Research sections">
        {SECTIONS.map((item) => (
          <Button
            key={item.id}
            role="tab"
            aria-selected={section === item.id}
            variant={section === item.id ? "default" : "ghost"}
            className={`min-h-11 shrink-0 ${section === item.id ? "bg-[#1D3A2C] text-white hover:bg-[#2F5E48]" : "text-[#5E6258]"}`}
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {section === "prelims" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <CardShell title="Subject frequency by year" overline="PYQ classification · 2014–2026" testId="research-prelims-chart">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-[#383A34]" htmlFor="research-prelims-subject">Subject</label>
              <Select value={selectedPrelimsSubject} onValueChange={setPrelimsSubject}>
                <SelectTrigger id="research-prelims-subject" className="min-h-11 w-64 max-w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{prelimSubjects.map((subject) => <SelectItem key={subject} value={subject}>{subject}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prelimSeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#F0EDE5" vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: "#5E6258", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "#5E6258", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="questions" name="Tagged questions" fill="#C8640E" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#5E6258]">{data.prelims.source_note}</p>
          </CardShell>

          <CardShell title="Topics recurring across years" overline={`${data.prelims.subtopic_recurrence.length} classified topics · filtered below`} testId="research-recurrence-table">
            <Input aria-label="Search recurring topics" value={recurrenceSearch} onChange={(event) => setRecurrenceSearch(event.target.value)} placeholder="Filter all 174 topics…" className="mb-3 min-h-11" />
            <div className="max-h-[22rem] overflow-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs text-[#5E6258]"><tr><th className="py-2 pr-3">Topic</th><th className="px-2 py-2 text-right">Years</th><th className="px-2 py-2 text-right">Questions</th></tr></thead>
                <tbody>{recurrence.map((row) => <tr key={row.subtopic} className="border-t border-[#F0EDE5]"><td className="py-2 pr-3 text-[#1C1D18]">{row.subtopic}</td><td className="px-2 py-2 text-right tabular-nums">{row.unique_years}</td><td className="px-2 py-2 text-right tabular-nums">{row.question_count}</td></tr>)}</tbody>
              </table>
            </div>
          </CardShell>

          <CardShell title="Question bank coverage" overline="Text and answer-key QA" testId="research-pyq-coverage">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Full-text records" value={data.coverage.full_text_questions} sub="matched to active PYQs" />
              <StatCard label="Topic-title only" value={data.coverage.topic_title_only_questions} sub="open official paper for wording" />
              <StatCard label="Answer-key status" value={Object.values(data.prelims.summary.source_status_totals).reduce((sum, count) => sum + count, 0)} sub="records with source status" />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[#5E6258]">{data.coverage.without_research_text} active records have no matching text entry. Exact text is shown only when marked FULL_TEXT; topic-title records link to the official UPSC paper. Answer/source verification labels remain attached to each record.</p>
          </CardShell>
        </div>
      ) : null}

      {section === "mains" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <CardShell title={`${mainsPaper} topic trend`} overline={`Supplied marks table · ${mainsYear}`} testId="research-mains-trend">
            <div className="mb-4 flex flex-wrap gap-3">
              <Select value={mainsPaper} onValueChange={setMainsPaper}><SelectTrigger className="min-h-11 w-40"><SelectValue /></SelectTrigger><SelectContent>{data.mains.sections.map((paper) => <SelectItem key={paper} value={paper}>{paper}</SelectItem>)}</SelectContent></Select>
              <Select value={String(mainsYear)} onValueChange={(year) => setMainsYear(Number(year))}><SelectTrigger className="min-h-11 w-32"><SelectValue /></SelectTrigger><SelectContent>{data.mains.years.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="h-72 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.mains.years.map((year) => ({ year, marks: data.mains.rows.filter((row) => row.paper === mainsPaper).reduce<number | null>((sum, row) => { const value = row.marks[String(year)]; return value == null ? sum : (sum ?? 0) + value; }, null) }))} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#F0EDE5" vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: "#5E6258", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#5E6258", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line dataKey="marks" name="Source-table tagged marks" stroke="#0F5B78" strokeWidth={2} connectNulls={false} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 max-h-64 overflow-auto">
              <table className="w-full min-w-[32rem] text-left text-sm"><thead className="sticky top-0 bg-white text-xs text-[#5E6258]"><tr><th className="py-2 pr-3">Subject / topic</th><th className="px-2 py-2 text-right">Tagged marks</th></tr></thead><tbody>{mainsRows.map((row) => <tr key={row.topic} className="border-t border-[#F0EDE5]"><td className="py-2 pr-3"><span className="font-medium">{row.subject}</span><span className="block text-xs text-[#5E6258]">{row.topic}</span></td><td className="px-2 py-2 text-right tabular-nums">{row.selectedMarks ?? "—"}</td></tr>)}</tbody></table>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[#5E6258]">{data.mains.source_note} Tagged topic totals may overlap; blanks are kept as unknown and are not converted to zero.</p>
          </CardShell>
          <CardShell title="Subject weightage notes" overline="How to read this" testId="research-weightage-note">
            <p className="text-sm leading-relaxed text-[#383A34]">{data.weightage.note}</p>
            <p className="mt-4 text-xs leading-relaxed text-[#5E6258]">This research is a planning signal, not a prediction or official UPSC weightage. Use the subject/year table for classification coverage and the paper link for original questions.</p>
            <Badge className="mt-4 border-0 bg-[#FEF3E2] text-[#8A3D04]">Not an official UPSC publication</Badge>
          </CardShell>
        </div>
      ) : null}

      {section === "coverage" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <CardShell title="Subject taxonomy" overline="Prelims · Mains · cross-cutting" testId="research-subject-catalog">
            <div className="max-h-[30rem] overflow-auto"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-white text-xs text-[#5E6258]"><tr><th className="py-2">Subject</th><th className="py-2">Track</th></tr></thead><tbody>{data.subject_catalog.map((item) => <tr key={item.id} className="border-t border-[#F0EDE5]"><td className="py-2.5 font-medium" style={{ color: item.accent }}>{item.label}</td><td className="py-2.5 text-[#5E6258]">{item.group}</td></tr>)}</tbody></table></div>
            <div className="mt-4 rounded-lg border border-[#D9A441]/40 bg-[#FEF8E8] p-3 text-sm text-[#5A4314]" data-testid="optional-syllabus-coverage">Optional taxonomy found: {data.coverage.optional_subject_labels.join(", ") || "none"}. Detailed optional-paper topics are not supplied in the source bundle; no missing syllabus has been fabricated.</div>
          </CardShell>
          <CardShell title="2027 test calendar" overline="Research planning asset" testId="research-test-schedule">
            <p className="mb-3 text-xs leading-relaxed text-[#5E6258]">This is a supplied study/mock schedule, not a UPSC official exam timetable or UPSC question forecast.</p>
            <div className="mb-3 flex items-center gap-3"><span className="text-sm font-medium">Subject</span><Select value={scheduleSubject} onValueChange={setScheduleSubject}><SelectTrigger className="min-h-11 w-64 max-w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All {data.coverage.scheduled_test_papers} tests</SelectItem>{scheduleSubjects.map((subject) => <SelectItem key={subject} value={subject}>{subject}</SelectItem>)}</SelectContent></Select></div>
            <div className="max-h-[28rem] overflow-auto"><table className="w-full min-w-[32rem] text-left text-sm"><thead className="sticky top-0 bg-white text-xs text-[#5E6258]"><tr><th className="py-2">Date / test</th><th className="py-2">Subject</th><th className="py-2">Focus</th></tr></thead><tbody>{allTests.map((paper) => <tr key={String(paper["Test ID"])} className="border-t border-[#F0EDE5]"><td className="py-2.5 pr-2"><span className="block font-medium">{String(paper.Date ?? "—")}</span><span className="text-xs text-[#5E6258]">{String(paper["Test ID"] ?? "")}</span></td><td className="py-2.5 pr-2">{String(paper["Core Subject"] ?? paper.Level ?? "—")}</td><td className="py-2.5 text-xs text-[#5E6258]">{String(paper["Core Topic"] ?? paper["CA Focus"] ?? "—")}</td></tr>)}</tbody></table></div>
          </CardShell>
          <CardShell title="Prelims & Mains tag weightage" overline="All 23 research categories" testId="research-weightage-table">
            <div className="max-h-[28rem] overflow-auto"><table className="w-full min-w-[34rem] text-left text-sm"><thead className="sticky top-0 bg-white text-xs text-[#5E6258]"><tr><th className="py-2 pr-2">GS / subject</th><th className="px-2 py-2 text-right">Prelims tags</th><th className="px-2 py-2 text-right">Mains tagged marks</th><th className="px-2 py-2 text-right">2026 tags</th></tr></thead><tbody>{weightageRows.map((row) => <tr key={row.subject} className="border-t border-[#F0EDE5]"><td className="py-2 pr-2"><span className="block text-xs text-[#5E6258]">{row.gs}</span>{row.subject}</td><td className="px-2 py-2 text-right tabular-nums">{row.prelimsQuestions ?? "Not tagged"}</td><td className="px-2 py-2 text-right tabular-nums">{row.mainsTaggedMarks2013_2026.toLocaleString()}</td><td className="px-2 py-2 text-right tabular-nums">{row.mains2026TaggedMarks ?? "—"}</td></tr>)}</tbody></table></div><p className="mt-3 text-xs text-[#5E6258]">{data.weightage.note}</p>
          </CardShell>
        </div>
      ) : null}

      {section === "current" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <CardShell title="2026 question-form signals" overline="External analytical buckets" testId="research-2026-form-signals">
            <p className="mb-3 text-xs text-[#5E6258]">These are secondary-analysis labels, not official UPSC question-format labels.</p>
            <div className="space-y-3">{Object.entries(data.post_2026.findings.latest_2026_style_signals).filter((entry): entry is [string, number] => typeof entry[1] === "number").map(([name, count]) => {
              const maximum = Math.max(...Object.values(data.post_2026.findings.latest_2026_style_signals).filter((value): value is number => typeof value === "number"));
              return <div key={name} className="grid grid-cols-[minmax(8rem,1fr)_minmax(4rem,2fr)_2rem] items-center gap-3 text-sm"><span className="text-[#383A34]">{name.replaceAll("_", " ")}</span><div className="h-2 overflow-hidden rounded-full bg-[#F0EDE5]"><div className="h-full rounded-full bg-[#0F5B78]" style={{ width: `${maximum ? (count / maximum) * 100 : 0}%` }} /></div><span className="text-right font-mono tabular-nums text-[#5E6258]">{count}</span></div>;
            })}</div>
            <p className="mt-3 text-xs text-[#5E6258]">{String(data.post_2026.findings.latest_2026_style_signals.note ?? "")}</p>
          </CardShell>
          <CardShell title="Public current-affairs quiz signals" overline={`Post-${data.post_2026.findings.cutoff} · ${data.coverage.post_2026_quiz_signals} records`} testId="research-current-quiz">
            <p className="mb-3 text-xs text-[#5E6258]">These public quiz topics are a current-topic pulse only; they are not UPSC predictions.</p>
            <div className="max-h-[26rem] overflow-auto"><table className="w-full min-w-[34rem] text-left text-sm"><thead className="sticky top-0 bg-white text-xs text-[#5E6258]"><tr><th className="py-2">Date / source</th><th className="py-2">Stream / topics</th></tr></thead><tbody>{data.post_2026.quiz_stream.map((row, index) => <tr key={`${row.date}-${index}`} className="border-t border-[#F0EDE5]"><td className="py-2.5 pr-3"><span className="block">{row.date}</span><span className="text-xs text-[#5E6258]">{row.source}</span></td><td className="py-2.5"><span className="block font-medium">{row.stream}</span><span className="text-xs text-[#5E6258]">{row.topics}</span>{row.url ? <a href={row.url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-[#9B4E08] underline">Source</a> : null}</td></tr>)}</tbody></table></div>
          </CardShell>
          <CardShell title="Source registry" overline={`${data.coverage.post_2026_sources} reviewed records`} testId="research-source-registry">
            <div className="max-h-[26rem] overflow-auto"><table className="w-full min-w-[34rem] text-left text-sm"><thead className="sticky top-0 bg-white text-xs text-[#5E6258]"><tr><th className="py-2">Tier / source</th><th className="py-2">Use and verification note</th></tr></thead><tbody>{data.post_2026.source_registry.map((row) => <tr key={row.source_id} className="border-t border-[#F0EDE5]"><td className="py-2.5 pr-3"><span className="block font-medium">{row.source}</span><span className="text-xs text-[#5E6258]">{row.tier} · {row.source_date}</span>{row.source_url ? <a href={row.source_url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-[#9B4E08] underline">Open source</a> : null}</td><td className="py-2.5 text-xs text-[#5E6258]">{row.signal}<span className="mt-1 block">{row.notes}</span></td></tr>)}</tbody></table></div>
          </CardShell>
          <CardShell title="2027 mock-series ecosystem" overline={`${data.coverage.mock_providers} public provider records`} testId="research-mock-ecosystem">
            <p className="mb-3 text-xs text-[#5E6258]">Provider catalog claims are kept separate from question-level evidence; gated content is not inferred.</p>
            <div className="max-h-[26rem] overflow-auto"><table className="w-full min-w-[34rem] text-left text-sm"><thead className="sticky top-0 bg-white text-xs text-[#5E6258]"><tr><th className="py-2">Provider / program</th><th className="py-2">Published test architecture</th></tr></thead><tbody>{data.post_2026.mock_ecosystem.map((row) => <tr key={`${row.provider}-${row.program}`} className="border-t border-[#F0EDE5]"><td className="py-2.5 pr-3"><span className="block font-medium">{row.provider}</span><span className="text-xs text-[#5E6258]">{row.program}</span>{row.url ? <a href={row.url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-[#9B4E08] underline">Provider source</a> : null}</td><td className="py-2.5 text-xs text-[#5E6258]">{row.architecture}<span className="mt-1 block">{row.data_access}</span></td></tr>)}</tbody></table></div>
          </CardShell>
          <CardShell title="2026 external calibration" overline={`${data.coverage.external_2026_calibration_rows} secondary checks`} testId="research-calibration">
            <div className="max-h-[26rem] overflow-auto"><table className="w-full min-w-[32rem] text-left text-sm"><thead className="sticky top-0 bg-white text-xs text-[#5E6258]"><tr><th className="py-2">Year / source</th><th className="py-2">Observed claim and role</th></tr></thead><tbody>{data.post_2026.external_calibration.map((row, index) => <tr key={`${row.source}-${index}`} className="border-t border-[#F0EDE5]"><td className="py-2.5 pr-3">{row.year} · {row.source}{row.url ? <a href={row.url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-[#9B4E08] underline">Reference</a> : null}</td><td className="py-2.5 text-xs text-[#5E6258]">{row.observed_claim_or_metric}<span className="mt-1 block">{row.role}</span></td></tr>)}</tbody></table></div>
            <div className="mt-4 rounded-lg border border-[#D9A441]/40 bg-[#FEF8E8] p-3 text-xs leading-relaxed text-[#5A4314]">Research cutoff: {data.post_2026.findings.cutoff}. Provider and coaching analyses are contextual research, not official UPSC setter evidence or guaranteed forecasts.</div>
          </CardShell>
          <CardShell title="Study-engine implications" overline="Research-derived, not predictions" testId="research-engine-implications">
            <ul className="space-y-2">{data.post_2026.findings.engine_implications.map((item, index) => <li key={index} className="flex gap-2 border-b border-[#F0EDE5] py-2 text-sm leading-relaxed text-[#383A34]"><span className="font-mono text-[#0F5B78]">{String(index + 1).padStart(2, "0")}</span><span>{typeof item === "string" ? item : JSON.stringify(item)}</span></li>)}</ul>
            <p className="mt-4 text-xs leading-relaxed text-[#5E6258]">Evidence rules used in this layer:</p>
            <ul className="mt-2 space-y-1">{data.post_2026.findings.rules.map((rule, index) => <li key={index} className="text-xs leading-relaxed text-[#5E6258]">{rule}</li>)}</ul>
          </CardShell>
        </div>
      ) : null}

      <p className="text-xs text-[#7A7D73]" data-testid="research-data-source">Dataset scope: {data.coverage.prelims_years} Prelims metadata · supplied {data.mains.version} · schedule {data.schedule.version}. PYQ categories and supplied trend tables have separate provenance.</p>
    </div>
  );
}