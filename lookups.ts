import type { AdminPermission } from "./permissions";
import type { AuditAction } from "./audit";

export type LookupFieldType = "text" | "textarea" | "boolean" | "select" | "tags" | "number";

export interface LookupColumn {
  key: string;
  label: string;
  type: LookupFieldType;
  required?: boolean;
  options?: string[]; // for "select"
  showInTable?: boolean; // defaults to true
}

export interface LookupConfig {
  table: string;
  label: string; // plural display label, e.g. "Programmes"
  singular: string; // "Programme"
  columns: LookupColumn[];
  defaultSort: string;
  viewPermission: AdminPermission;
  editPermission: AdminPermission;
  createdAction: AuditAction;
  updatedAction: AuditAction;
  deletedAction: AuditAction;
}

export const LOOKUPS: Record<string, LookupConfig> = {
  departments: {
    table: "departments",
    label: "Departments",
    singular: "Department",
    columns: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    defaultSort: "name",
    viewPermission: "research.view",
    editPermission: "research.edit",
    createdAction: "department.created",
    updatedAction: "department.updated",
    deletedAction: "department.deleted",
  },
  campuses: {
    table: "campuses",
    label: "Campuses",
    singular: "Campus",
    columns: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "county", label: "County", type: "text" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    defaultSort: "name",
    viewPermission: "research.view",
    editPermission: "research.edit",
    createdAction: "campus.created",
    updatedAction: "campus.updated",
    deletedAction: "campus.deleted",
  },
  programmes: {
    table: "programmes",
    label: "Programmes",
    singular: "Programme",
    columns: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    defaultSort: "name",
    viewPermission: "research.view",
    editPermission: "research.edit",
    createdAction: "programme.created",
    updatedAction: "programme.updated",
    deletedAction: "programme.deleted",
  },
  supervisors: {
    table: "supervisors",
    label: "Supervisors",
    singular: "Supervisor",
    columns: [
      { key: "full_name", label: "Full Name", type: "text", required: true },
      { key: "email", label: "Email", type: "text" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    defaultSort: "full_name",
    viewPermission: "research.view",
    editPermission: "research.edit",
    createdAction: "supervisor.created",
    updatedAction: "supervisor.updated",
    deletedAction: "supervisor.deleted",
  },
  healthcare_facilities: {
    table: "healthcare_facilities",
    label: "Healthcare Facilities",
    singular: "Facility",
    columns: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "facility_level", label: "Level", type: "text" },
      { key: "county", label: "County", type: "text" },
      { key: "facility_type", label: "Type", type: "text" },
      { key: "available_equipment", label: "Equipment", type: "tags", showInTable: false },
      { key: "available_services", label: "Services", type: "tags", showInTable: false },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    defaultSort: "name",
    viewPermission: "research.view",
    editPermission: "research.edit",
    createdAction: "facility.created",
    updatedAction: "facility.updated",
    deletedAction: "facility.deleted",
  },
  research_areas: {
    table: "research_areas",
    label: "Research Areas",
    singular: "Research Area",
    columns: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "programmes", label: "Programmes", type: "tags" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    defaultSort: "name",
    viewPermission: "research.view",
    editPermission: "research.edit",
    createdAction: "research_area.created",
    updatedAction: "research_area.updated",
    deletedAction: "research_area.deleted",
  },
};

export function getLookupConfig(table: string): LookupConfig | null {
  return LOOKUPS[table] ?? null;
}
