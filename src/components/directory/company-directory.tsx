"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, List, Map, MapPin, Search, X, Wrench, Info } from "lucide-react";
import { CATEGORY_ORDER, CATEGORY_LABELS, URGENCY_LABELS, type ServiceCategory, type UrgencyLevel } from "@/lib/categories";
import { filterCompanies, type DirectoryCompany } from "@/lib/directory";
import type { ServiceEstimates } from "@/lib/pricing";
import { CategoryIcon } from "@/components/category-icon";

const CompanyMap = dynamic(() => import("./company-map"), { ssr: false, loading: () => <div className="map-loading">Loading the map…</div> });

export function CompanyDirectory({ initialCategory, estimates }: { initialCategory: ServiceCategory | "ALL"; estimates: ServiceEstimates }) {
  const [category, setCategory] = useState<ServiceCategory | "ALL">(initialCategory);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [booking, setBooking] = useState(false);
  const companies = useMemo(() => filterCompanies(category, query), [category, query]);
  const company = companies.find(item => item.id === selected) ?? null;
  function chooseCompany(id: string) { setSelected(id); setBooking(false); setView("list"); }
  function chooseCategory(value: ServiceCategory | "ALL") { setCategory(value); setSelected(null); setBooking(false); }
  return <div className="directory-app">
    <nav className="service-category-bar" aria-label="Filter by service"><button type="button" aria-pressed={category === "ALL"} onClick={() => chooseCategory("ALL")}><List size={19} /><span>All services</span></button>{CATEGORY_ORDER.map(item => <button type="button" key={item} aria-pressed={category === item} onClick={() => chooseCategory(item)}><CategoryIcon category={item} className="h-[19px] w-[19px]" /><span>{CATEGORY_LABELS[item]}</span></button>)}</nav>
    <div className="directory-toolbar"><div><MapPin size={17} /><strong>Austin, TX</strong><span className="directory-demo">Demo directory</span></div><label className="company-search"><Search size={16} /><input aria-label="Search companies or neighborhoods" placeholder="Search company or neighborhood" value={query} onChange={event => { setQuery(event.target.value); setSelected(null); }} />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={14} /></button>}</label><div className="directory-mobile-toggle"><button onClick={() => setView("list")} aria-pressed={view === "list"}><List size={16} /> List</button><button onClick={() => setView("map")} aria-pressed={view === "map"}><Map size={16} /> Map</button></div></div>
    <div className={`directory-workspace view-${view}`}>
      <aside className="company-list-panel" aria-label="Companies">
        {company ? <div className="company-detail" key={company.id}><button type="button" className="back-to-companies" onClick={() => { setSelected(null); setBooking(false); }}><ArrowLeft size={15} /> All companies</button>
          {booking ? <BookingPreview key={`${company.id}-${category}`} company={company} category={category === "ALL" ? company.categories[0] : category} estimates={estimates} onBack={() => setBooking(false)} /> : <>
            <div className="company-detail-heading"><CompanyMonogram company={company} /><span className="directory-demo">Demo company</span></div><h1>{company.name}</h1><p className="company-neighborhood"><MapPin size={14} />{company.neighborhood}</p><div className="company-detail-tags">{company.categories.map(item => <span key={item}>{CATEGORY_LABELS[item]}</span>)}</div><p className="company-description">{company.description}</p>
            <h2>What they can help with</h2><ul className="company-specialties">{company.specialties.map(item => <li key={item}><Check size={15} />{item}</li>)}</ul>
            <div className="company-worker"><span><Wrench size={20} /></span><div><strong>{company.worker} · Field worker</strong><p>Example location shown on the map</p></div></div>
            <div className="company-price"><span>Callout + first hour estimate</span><strong>${estimates[category === "ALL" ? company.categories[0] : category].THIS_WEEK.low}–${estimates[category === "ALL" ? company.categories[0] : category].THIS_WEEK.high}</strong><p>For a flexible request. Parts and extra time are additional.</p></div>
            <button type="button" className="directory-primary" onClick={() => setBooking(true)}>Book service <ArrowRight size={18} /></button><p className="company-demo-note">This is a fictional company. Booking is a preview; no worker is dispatched.</p>
          </>}
        </div> : <><div className="companies-heading"><h1>{category === "ALL" ? "Companies near you" : `${CATEGORY_LABELS[category]} in Austin`}</h1><p>{companies.length} demo {companies.length === 1 ? "company" : "companies"} · Select one to see details</p></div><div className="company-results">{companies.map((item, index) => <button type="button" key={item.id} className="company-result" onClick={() => chooseCompany(item.id)}><div className="company-card-heading"><CompanyMonogram company={item} /><span className="company-map-number">{index + 1}</span></div><h2>{item.name}</h2><p><MapPin size={13} />{item.neighborhood}</p><div className="company-card-categories">{item.categories.map(c => CATEGORY_LABELS[c]).join(" · ")}</div><div className="company-card-bottom"><span>From <strong>${estimates[category === "ALL" ? item.categories[0] : category].THIS_WEEK.low}</strong><small> callout + first hour</small></span><ChevronRight size={18} /></div></button>)}{!companies.length && <div className="company-no-results"><Search size={28} /><h2>No matching companies</h2><p>Try a different company name, neighborhood, or service.</p><button onClick={() => { setQuery(""); chooseCategory("ALL"); }}>Clear filters</button></div>}</div><p className="directory-list-note"><Info size={15} />Companies and worker locations are examples. They aren’t live availability.</p></>}
      </aside>
      <section className="directory-map-panel" aria-label="Worker map"><CompanyMap companies={companies} selectedId={selected} onSelect={chooseCompany} /></section>
    </div>
  </div>;
}

function CompanyMonogram({ company }: { company: DirectoryCompany }) {
  return <span className="company-monogram" style={{ color: company.color, background: `${company.color}12` }}>{company.initials}</span>;
}

function BookingPreview({ company, category, estimates, onBack }: { company: DirectoryCompany; category: ServiceCategory; estimates: ServiceEstimates; onBack: () => void }) {
  const [service, setService] = useState(category);
  const [urgency, setUrgency] = useState<UrgencyLevel>("THIS_WEEK");
  const [description, setDescription] = useState("");
  const [done, setDone] = useState(false);
  const estimate = estimates[service][urgency];
  if (done) return <div className="booking-preview-done"><span><Check size={27} /></span><h1>Your booking preview</h1><p>You’ve selected {company.name} for {CATEGORY_LABELS[service].toLowerCase()}.</p><dl><div><dt>Preferred timing</dt><dd>{URGENCY_LABELS[urgency]}</dd></div><div><dt>Estimate</dt><dd>${estimate.low}–${estimate.high}</dd></div></dl><div className="demo-booking-disclosure">Demo only. Nothing was sent, no appointment was confirmed, and no payment was collected.</div><button className="directory-primary" onClick={onBack}>Back to company</button><Link href={`/request/new?category=${service}&urgency=${urgency}&q=${encodeURIComponent(description)}`} className="directory-general-request">Create a general service request <ArrowRight size={15} /></Link></div>;
  return <form className="company-booking-form" onSubmit={event => { event.preventDefault(); setDone(true); }}><button type="button" onClick={onBack} className="back-to-companies"><ArrowLeft size={15} /> Company details</button><span className="directory-demo">Demo booking</span><h1>Book {company.name}</h1><p>Choose the service and preferred timing to preview your request.</p><label>Service<select value={service} onChange={e => setService(e.target.value as ServiceCategory)}>{company.categories.map(item => <option value={item} key={item}>{CATEGORY_LABELS[item]}</option>)}</select></label><label>When do you need help?<select value={urgency} onChange={e => setUrgency(e.target.value as UrgencyLevel)}><option value="THIS_WEEK">This week</option><option value="TODAY">Today</option><option value="EMERGENCY">As soon as possible</option></select></label><label>What needs doing?<textarea minLength={10} maxLength={1000} required rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the problem and what you need help with." /></label><div className="company-price" aria-live="polite"><span>Callout + first hour estimate</span><strong>${estimate.low}–${estimate.high}</strong><p>Parts and extra time are additional.</p></div><button className="directory-primary" type="submit">Preview booking <ArrowRight size={18} /></button><p className="company-demo-note">No account or payment is needed for this demo. Nothing will be sent to a company.</p></form>;
}
