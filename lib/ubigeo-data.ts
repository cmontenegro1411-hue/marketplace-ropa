export interface Department {
  id: string;
  name: string;
}

export interface Province {
  id: string;
  departmentId: string;
  name: string;
}

export interface District {
  id: string;
  provinceId: string;
  name: string;
}

export const DEPARTMENTS: Department[] = [
  { id: '15', name: 'Lima' },
  { id: '04', name: 'Arequipa' },
  { id: '13', name: 'La Libertad' },
  { id: '20', name: 'Piura' },
  { id: '07', name: 'Callao' },
  { id: '01', name: 'Amazonas' },
  { id: '02', name: 'Ancash' },
  { id: '03', name: 'Apurímac' },
  { id: '05', name: 'Ayacucho' },
  { id: '06', name: 'Cajamarca' },
  { id: '08', name: 'Cusco' },
  { id: '09', name: 'Huancavelica' },
  { id: '10', name: 'Huánuco' },
  { id: '11', name: 'Ica' },
  { id: '12', name: 'Junín' },
  { id: '14', name: 'Lambayeque' },
  { id: '16', name: 'Loreto' },
  { id: '17', name: 'Madre de Dios' },
  { id: '18', name: 'Moquegua' },
  { id: '19', name: 'Pasco' },
  { id: '21', name: 'Puno' },
  { id: '22', name: 'San Martín' },
  { id: '23', name: 'Tacna' },
  { id: '24', name: 'Tumbes' },
  { id: '25', name: 'Ucayali' },
];

export const PROVINCES: Province[] = [
  { id: '1501', departmentId: '15', name: 'Lima' },
  { id: '0701', departmentId: '07', name: 'Callao' },
  { id: '0401', departmentId: '04', name: 'Arequipa' },
  { id: '1301', departmentId: '13', name: 'Trujillo' },
  { id: '2001', departmentId: '20', name: 'Piura' },
  // Add more as needed or use a full dataset
];

export const DISTRICTS: District[] = [
  // Lima
  { id: '150101', provinceId: '1501', name: 'Lima' },
  { id: '150102', provinceId: '1501', name: 'Ancón' },
  { id: '150103', provinceId: '1501', name: 'Ate' },
  { id: '150104', provinceId: '1501', name: 'Barranco' },
  { id: '150105', provinceId: '1501', name: 'Breña' },
  { id: '150106', provinceId: '1501', name: 'Carabayllo' },
  { id: '150107', provinceId: '1501', name: 'Chaclacayo' },
  { id: '150108', provinceId: '1501', name: 'Chorrillos' },
  { id: '150109', provinceId: '1501', name: 'Cieneguilla' },
  { id: '150110', provinceId: '1501', name: 'Comas' },
  { id: '150111', provinceId: '1501', name: 'El Agustino' },
  { id: '150112', provinceId: '1501', name: 'Independencia' },
  { id: '150113', provinceId: '1501', name: 'Jesús María' },
  { id: '150114', provinceId: '1501', name: 'La Molina' },
  { id: '150115', provinceId: '1501', name: 'La Victoria' },
  { id: '150116', provinceId: '1501', name: 'Lince' },
  { id: '150117', provinceId: '1501', name: 'Los Olivos' },
  { id: '150118', provinceId: '1501', name: 'Lurigancho' },
  { id: '150119', provinceId: '1501', name: 'Lurín' },
  { id: '150120', provinceId: '1501', name: 'Magdalena del Mar' },
  { id: '150121', provinceId: '1501', name: 'Pueblo Libre' },
  { id: '150122', provinceId: '1501', name: 'Miraflores' },
  { id: '150123', provinceId: '1501', name: 'Pachacámac' },
  { id: '150124', provinceId: '1501', name: 'Pucusana' },
  { id: '150125', provinceId: '1501', name: 'Puente Piedra' },
  { id: '150126', provinceId: '1501', name: 'Punta Hermosa' },
  { id: '150127', provinceId: '1501', name: 'Punta Negra' },
  { id: '150128', provinceId: '1501', name: 'Rímac' },
  { id: '150129', provinceId: '1501', name: 'San Bartolo' },
  { id: '150130', provinceId: '1501', name: 'San Borja' },
  { id: '150131', provinceId: '1501', name: 'San Isidro' },
  { id: '150132', provinceId: '1501', name: 'San Juan de Lurigancho' },
  { id: '150133', provinceId: '1501', name: 'San Juan de Miraflores' },
  { id: '150134', provinceId: '1501', name: 'San Luis' },
  { id: '150135', provinceId: '1501', name: 'San Martín de Porres' },
  { id: '150136', provinceId: '1501', name: 'San Miguel' },
  { id: '150137', provinceId: '1501', name: 'Santa Anita' },
  { id: '150138', provinceId: '1501', name: 'Santa María del Mar' },
  { id: '150139', provinceId: '1501', name: 'Santa Rosa' },
  { id: '150140', provinceId: '1501', name: 'Santiago de Surco' },
  { id: '150141', provinceId: '1501', name: 'Surquillo' },
  { id: '150142', provinceId: '1501', name: 'Villa El Salvador' },
  { id: '150143', provinceId: '1501', name: 'Villa María del Triunfo' },
  // Trujillo
  { id: '130101', provinceId: '1301', name: 'Trujillo' },
  { id: '130102', provinceId: '1301', name: 'Huanchaco' },
  // Callao
  { id: '070101', provinceId: '0701', name: 'Callao' },
  { id: '070102', provinceId: '0701', name: 'Bellavista' },
  { id: '070103', provinceId: '0701', name: 'Carmen de la Legua' },
  { id: '070104', provinceId: '0701', name: 'La Perla' },
  { id: '070105', provinceId: '0701', name: 'La Punta' },
  { id: '070106', provinceId: '0701', name: 'Ventanilla' },
];
