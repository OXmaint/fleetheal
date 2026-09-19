export type Severity = "critical" | "major" | "minor";
export type WorkOrderPriority = "P1" | "P2" | "P3";

export type PhotoFlag = {
  id: string;
  label: string;
  present: boolean;
};

export type DvirDefect = {
  code: string;
  system: string;
  severity: Severity;
  oos_candidate: boolean;
  description: string;
  photos: PhotoFlag[];
  meta_flags?: string[];
};

export type Vehicle = {
  id: string;
  unit_number: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  status: string;
  odometer_miles: number;
  home_shop: string;
  next_dispatch: string;
  route: string;
  grounded_reason?: string;
  grounded_at?: string;
};

export type Dvir = {
  id: string;
  vehicle_id: string;
  inspector: string;
  inspected_at: string;
  location: string;
  overall: string;
  defects: DvirDefect[];
};

export type OpenDefect = {
  id: string;
  vehicle_id: string;
  dvir_id: string;
  code: string;
  severity: Severity;
  status: string;
  opened_at: string;
};

export type WorkOrder = {
  id: string;
  vehicle_id: string;
  status: string;
  priority: string;
  summary: string;
  closed_at?: string;
  bay?: string;
  defect_id?: string | null;
  opened_at?: string;
};

export type PmStatus = {
  vehicle_id: string;
  pm_type: string;
  due_miles: number;
  due_date: string;
  status: string;
};

export type Part = {
  sku: string;
  name: string;
  qty_on_hand: number;
};

export type Telematics = {
  vehicle_id: string;
  speed_mph: number;
  lat: number;
  lon: number;
  engine_hours: number;
  air_pressure_psi: number;
  fault_codes: string[];
  captured_at: string;
};

export type YardDetention = {
  vehicle_id: string;
  yard: string;
  detained: boolean;
  gate_status: string;
  notes: string;
};

/** Shape compatible with demo/seed.json */
export type FleetState = {
  vehicles: Vehicle[];
  dvirs: Dvir[];
  open_defects: OpenDefect[];
  work_orders: WorkOrder[];
  pm_status: PmStatus[];
  parts_catalog: Part[];
  telematics: Telematics[];
  yard_detention: YardDetention[];
};

export type StoreBackend = "blob" | "redis" | "file" | "memory";

export type StoreMeta = {
  backend: StoreBackend;
  durable: boolean;
  warning?: string;
};

export type CreateDvirInput = {
  vehicle_id: string;
  inspector: string;
  severity: Severity;
  system: string;
  description: string;
  oos_candidate?: boolean;
  photo_present?: boolean;
  location?: string;
};

export const FLEET_SYSTEMS = [
  "service_brakes",
  "lighting",
  "steering",
  "tires",
  "coupling",
  "exhaust",
  "fuel",
  "windshield",
  "wipers",
  "horn",
  "suspension",
] as const;

export const SEVERITIES: Severity[] = ["critical", "major", "minor"];
