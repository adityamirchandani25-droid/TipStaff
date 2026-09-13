import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeDollarSign,
  CalendarClock,
  Check,
  Droplets,
  KeyRound,
  ListFilter,
  MapPin,
  MousePointer2,
  Phone,
  ShieldCheck,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { BrandLogo } from "@/components/brand-logo";
import { CategoryIcon } from "@/components/category-icon";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "@/lib/categories";
import { Reveal } from "@/components/marketing/reveal";
import "./marketplace.css";
import "./marketplace.dark.css";
import "./landing-polish.css";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const commonScenarios = [
  { icon: Droplets, eyebrow: "PLUMBING", title: "A leak that cannot wait", text: "Find available plumbing providers and request emergency or same-day help.", href: "/services?category=PLUMBING" },
  { icon: Zap, eyebrow: "ELECTRICAL", title: "Lights, outlets, or breakers", text: "Compare nearby electrical providers for the work you need done.", href: "/services?category=ELECTRICAL" },
  { icon: Wind, eyebrow: "HVAC", title: "The house will not cool down", text: "Browse HVAC options and see the starting service estimate.", href: "/services?category=HVAC" },
  { icon: KeyRound, eyebrow: "LOCKSMITH", title: "Locked out or lock trouble", text: "Get to the right category quickly and choose who to contact.", href: "/services?category=LOCKSMITH" },
];

export default function Home() {
  return <div className="landing-home"><SiteHeader current="home" /><a href="#main" className="skip-link">Skip to content</a><main id="main">
    <section className="landing-hero"><div className="landing-hero-copy"><span className="landing-eyebrow">LOCAL HELP. LIVE AVAILABILITY.</span><h1>The right help.<br /><span>Right around you.</span></h1><p>Find approved home-service professionals who are online near you, understand the starting cost, and send a real request—all in one place.</p><div className="landing-hero-actions"><Link href="/services" className="landing-primary">Find a service <ArrowRight size={19} /></Link><a href="#how-it-works">See how it works <ArrowUpRight size={17} /></a></div><div className="landing-hero-points"><span><Check size={15} />Approved providers</span><span><Check size={15} />Live nearby status</span><span><Check size={15} />Clear estimates</span></div></div>
    <div className="landing-product-preview" aria-label="Preview of the live provider browser"><div className="preview-window-top"><span /><span /><span /><small>Find your next helping hand</small></div><div className="preview-categories"><span><Wrench size={15} />All services</span><span>Plumbing</span><span>Electrical</span><span>More</span></div><div className="preview-browser"><div className="preview-companies"><span className="preview-list-label">Available near you</span><div className="preview-company active"><span>AP</span><div><strong>Approved pro</strong><small>Online now</small></div><Check size={14} /></div><div className="preview-company"><span>LT</span><div><strong>Local team</strong><small>3.8 miles away</small></div></div><div className="preview-company"><span>IP</span><div><strong>Independent pro</strong><small>Home repairs</small></div></div><div className="preview-view">View availability <ArrowRight size={13} /></div></div><div className="preview-map" aria-hidden="true"><div className="preview-river" /><span className="preview-map-label">YOUR AREA</span><span className="preview-pin one"><Wrench size={19} /></span><span className="preview-pin two"><Wrench size={19} /></span><span className="preview-pin three"><Wrench size={19} /></span><span className="preview-map-dot" /></div></div><div className="preview-caption"><MapPin size={13} />Product preview · live availability varies by location</div></div></section>
    <section className="landing-service-strip" aria-label="Available service categories"><span>What do you need?</span><div>{CATEGORY_ORDER.map(category => <Link key={category} href={`/services?category=${category}`}><CategoryIcon category={category} className="h-5 w-5" />{CATEGORY_LABELS[category]}</Link>)}</div></section>
    <Reveal><section className="landing-facts" aria-label="FixItFast at a glance"><article><strong>{CATEGORY_ORDER.length}</strong><span>service categories in one directory</span></article><article><strong>Side by side</strong><span>provider details, live map, and starting estimates</span></article><article><strong>One thread</strong><span>from the first request to its latest status</span></article></section></Reveal>
    <Reveal><section id="how-it-works" className="landing-section"><div className="landing-section-title"><span className="landing-eyebrow">FROM SEARCH TO SERVICE</span><h2>A simpler way to get it sorted.</h2><p>You pick the service. We show who is available. We keep the details together.</p></div><div className="landing-steps">{[
      { icon: ListFilter, title: "Start with what you need", text: "Choose plumbing, electrical, home repairs, or another service from the category bar." },
      { icon: MapPin, title: "See who’s around", text: "Use your location to see approved providers who are online and sharing a recent location nearby." },
      { icon: MousePointer2, title: "Create your request", text: "Check provider details and the starting estimate, then add your job details and preferred timing." },
    ].map(({ icon: Icon, title, text }, index) => <article key={title}><div><Icon size={25} /><span>0{index + 1}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div></section></Reveal>
    <Reveal><section className="landing-scenarios"><div className="landing-scenarios-heading"><span className="landing-eyebrow">START WITH THE MOMENT</span><h2>Whatever the house throws at you.</h2><p>Jump straight into a common service, or browse all nine categories.</p></div><div className="landing-scenario-grid">{commonScenarios.map(({ icon: Icon, eyebrow, title, text, href }) => <Link key={eyebrow} href={href} className="landing-scenario-card"><div><span>{eyebrow}</span><ArrowUpRight size={17} /></div><Icon className="landing-scenario-icon" size={31} /><h3>{title}</h3><p>{text}</p><small>Explore providers <ArrowRight size={14} /></small></Link>)}</div><Link href="/services" className="landing-inline-link">Browse every service category <ArrowRight size={16} /></Link></section></Reveal>
    <Reveal><section className="landing-expectations"><div className="landing-expectations-heading"><span className="landing-eyebrow">CLEAR FROM THE START</span><h2>Useful expectations.<br />No tiny-print surprises.</h2></div><div className="landing-expectation-list"><article><CalendarClock size={21} /><div><h3>A requested time is not yet confirmed</h3><p>Your timing preference is part of the request. The company still needs to confirm availability.</p></div></article><article><BadgeDollarSign size={21} /><div><h3>The estimate is a starting point</h3><p>It covers the displayed callout and first hour. Final pricing depends on parts and work completed on site.</p></div></article><article><ShieldCheck size={21} /><div><h3>You review before you send</h3><p>Check your service, details, address, timing, and estimated range in one place before submitting.</p></div></article></div></section></Reveal>
    <Reveal><section id="contact" className="landing-contact"><div className="landing-contact-intro"><span className="landing-contact-kicker">DIRECT LINE</span><h2>Real people.<br /><span>Ready to help.</span></h2><p>Questions about FixItFast, working with us, or getting started? Call the team directly.</p><div className="landing-contact-mark"><Phone size={18} /><span>Tap any number to call</span></div></div><div className="landing-contact-list">{[
      { name: "Aditya Mirchandani", role: "CEO / CTO", phone: "4048551929", display: "(404) 855-1929" },
      { name: "Prahul Kota", role: "COO", phone: "6789650263", display: "(678) 965-0263" },
      { name: "Prathya Kota", role: "Lead of Marketing", phone: "6789650264", display: "(678) 965-0264" },
    ].map((contact, index) => <a key={contact.phone} href={`tel:+1${contact.phone}`} className="landing-contact-card" aria-label={`Call ${contact.name}, ${contact.role}, at ${contact.display}`}><span className="landing-contact-number">0{index + 1}</span><div><strong>{contact.name}</strong><span className="landing-contact-role">{contact.role}</span><span className="landing-contact-phone">{contact.display}</span></div><span className="landing-contact-call"><Phone size={17} /></span></a>)}</div></section></Reveal>
    <section className="landing-last"><div><h2>What needs doing?</h2><p>Start with the service. See who is available nearby.</p></div><Link href="/services" className="landing-primary">Browse home services <ArrowRight size={18} /></Link></section>
  </main><footer className="landing-footer"><Link href="/" aria-label="FixItFast home"><BrandLogo /></Link><span>© {new Date().getFullYear()} FixItFast</span><Link href="/worker/signup">Work with FixItFast <ArrowUpRight size={14} /></Link></footer></div>;
}
