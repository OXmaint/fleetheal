const globalKey = '__fleetheal_store__';

function seed() {
  return {
    vehicles: [
      {
        id: 'TRK-4821',
        unit_number: '4821',
        make: 'Freightliner',
        model: 'Cascadia',
        year: 2021,
        status: 'in_service',
        home_shop: 'Bay-3 / Santa Clara Yard',
      },
      {
        id: 'TRK-1107',
        unit_number: '1107',
        make: 'Kenworth',
        model: 'T680',
        year: 2019,
        status: 'in_service',
        home_shop: 'Bay-1 / Santa Clara Yard',
      },
    ],
    dvirs: [
      {
        id: 'DVIR-9912',
        vehicle_id: 'TRK-4821',
        inspector: 'M. Chen',
        inspected_at: '2026-09-19T11:42:00-07:00',
        location: 'Santa Clara Yard — Lane B',
        overall: 'UNSATISFACTORY',
        crack_related: false,
        defects: [
          {
            code: 'BRAKE-SVC-LH-REAR',
            system: 'service_brakes',
            severity: 'critical',
            oos_candidate: true,
            crack_related: false,
            description:
              'Left-rear service brake chamber pushrod travel exceeds limit; audible air leak under apply.',
          },
        ],
      },
    ],
    open_defects: [
      {
        id: 'DEF-4410',
        vehicle_id: 'TRK-4821',
        dvir_id: 'DVIR-9912',
        code: 'BRAKE-SVC-LH-REAR',
        severity: 'critical',
        status: 'open',
        crack_related: false,
        opened_at: '2026-09-19T11:42:00-07:00',
        description: 'Critical LH rear service brake — OOS candidate',
      },
    ],
    meta: { updated_at: new Date().toISOString() },
  };
}

export function getStore() {
  if (!globalThis[globalKey]) {
    globalThis[globalKey] = seed();
  }
  return globalThis[globalKey];
}

export function saveStore(next) {
  next.meta = { updated_at: new Date().toISOString() };
  globalThis[globalKey] = next;
  return next;
}

export function createDvir(input) {
  const store = getStore();
  const n = store.dvirs.length + 9000;
  const dvirId = input.dvir_id || `DVIR-${n}`;
  const defId = `DEF-${4400 + store.open_defects.length + 1}`;
  const now = new Date().toISOString();
  const crack = Boolean(input.crack_related);
  const dvir = {
    id: dvirId,
    vehicle_id: input.vehicle_id || 'TRK-4821',
    inspector: input.inspector || 'Demo Inspector',
    inspected_at: now,
    location: input.location || 'Santa Clara Yard',
    overall: input.overall || 'UNSATISFACTORY',
    crack_related: crack,
    defects: [
      {
        code: input.code || (crack ? 'CRACK-STRUCTURE' : 'DEFECT-GENERAL'),
        system: input.system || (crack ? 'frame_body' : 'general'),
        severity: input.severity || 'critical',
        oos_candidate: input.oos_candidate !== false,
        crack_related: crack,
        description: input.description || 'Submitted from FleetHeal DVIR UI',
      },
    ],
  };
  const defect = {
    id: defId,
    vehicle_id: dvir.vehicle_id,
    dvir_id: dvirId,
    code: dvir.defects[0].code,
    severity: dvir.defects[0].severity,
    status: 'open',
    crack_related: crack,
    opened_at: now,
    description: dvir.defects[0].description,
  };
  store.dvirs.unshift(dvir);
  store.open_defects.unshift(defect);
  return saveStore(store);
}
