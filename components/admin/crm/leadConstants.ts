/**
 * Shared constants for the CRM Leads UI. Pure module — safe to import
 * from both server and client components.
 */

import type { LeadStatus, LeadRating, LeadSource } from "@/app/actions/crmLeadActions"

export const STATUS_ORDER: LeadStatus[] = [
  "new", "contacted", "qualified", "proposal", "won", "lost",
]

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new:        "New",
  contacted:  "Contacted",
  qualified:  "Qualified",
  proposal:   "Proposal",
  won:        "Won",
  lost:       "Lost",
}

/** Tailwind pill colours per stage. */
export const STATUS_PILL: Record<LeadStatus, { bg: string; text: string; dot: string }> = {
  new:        { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"    },
  contacted:  { bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "bg-indigo-500"  },
  qualified:  { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-500"  },
  proposal:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"   },
  won:        { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  lost:       { bg: "bg-gray-100",   text: "text-gray-600",    dot: "bg-gray-400"    },
}

export const RATING_LABELS: Record<LeadRating, string> = {
  hot: "Hot", warm: "Warm", cold: "Cold",
}

export const RATING_PILL: Record<LeadRating, { bg: string; text: string }> = {
  hot:  { bg: "bg-red-100",    text: "text-red-700"    },
  warm: { bg: "bg-orange-100", text: "text-orange-700" },
  cold: { bg: "bg-slate-100",  text: "text-slate-600"  },
}

export const SOURCE_LABELS: Record<LeadSource, string> = {
  website:        "Website",
  event:          "Event",
  referral:       "Referral",
  import:         "Import",
  campaign:       "Campaign",
  linkedin:       "LinkedIn",
  cold_outreach:  "Cold outreach",
  sponsor_booth:  "Sponsor booth",
  other:          "Other",
}

export const SOURCE_OPTIONS: LeadSource[] = [
  "website", "event", "referral", "campaign",
  "linkedin", "cold_outreach", "sponsor_booth", "other",
]

/** Candidate CSV header names → our internal field. Used for smart
 *  column auto-mapping during import. */
export const IMPORT_FIELD_ALIASES: Record<string, string> = {
  // firstName
  "first name": "firstName", "firstname": "firstName", "given name": "firstName", "fname": "firstName",
  // lastName
  "last name": "lastName", "lastname": "lastName", "surname": "lastName", "lname": "lastName",
  // email
  "email": "email", "e-mail": "email", "email address": "email", "mail": "email",
  // phone
  "phone": "phone", "mobile": "phone", "telephone": "phone", "contact": "phone", "phone number": "phone",
  // company
  "company": "company", "organisation": "company", "organization": "company", "business": "company", "account": "company",
  // title
  "title": "title", "job title": "title", "designation": "title", "position": "title", "role": "title",
  // industry
  "industry": "industry", "sector": "industry",
  // website
  "website": "websiteUrl", "website url": "websiteUrl", "url": "websiteUrl", "web": "websiteUrl",
  // linkedin
  "linkedin": "linkedinUrl", "linkedin url": "linkedinUrl", "linkedin profile": "linkedinUrl",
  // city / country
  "city": "city", "town": "city",
  "country": "country",
  // status / rating / source
  "status": "status", "stage": "status",
  "rating": "rating", "interest": "rating", "priority": "rating",
  "source": "source", "lead source": "source",
  // tags / description
  "tags": "tags", "labels": "tags",
  "description": "description", "notes": "description", "note": "description", "comments": "description",
}

export const IMPORT_FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: "ignore",       label: "— Do not import —" },
  { value: "firstName",    label: "First name" },
  { value: "lastName",     label: "Last name" },
  { value: "email",        label: "Email" },
  { value: "phone",        label: "Phone" },
  { value: "company",      label: "Company" },
  { value: "title",        label: "Job title" },
  { value: "industry",     label: "Industry" },
  { value: "websiteUrl",   label: "Website URL" },
  { value: "linkedinUrl",  label: "LinkedIn URL" },
  { value: "city",         label: "City" },
  { value: "country",      label: "Country" },
  { value: "status",       label: "Status" },
  { value: "rating",       label: "Rating" },
  { value: "source",       label: "Source" },
  { value: "tags",         label: "Tags (comma-separated)" },
  { value: "description",  label: "Description / notes" },
]
