export type Department = 'General Medicine' | 'Children' | 'Women and Pregnancy' | 'Bones and Joints' | 'ENT' | 'Eyes' | 'Skin';
export type PatientStatus = 'waiting' | 'called' | 'no-show' | 'served';
export type Patient = { id: string; token: string; firstName: string; age: number; gender: string; phone?: string; department: Department; status: PatientStatus; registeredAt: string; doctor: string; room: string; floor: number };
export type HospitalState = { patients: Patient[]; urgent: { active: boolean; createdAt?: string; acknowledged: boolean }; doctors: Record<string, boolean>; delays: Record<string, number> };
export const departments: Department[] = ['General Medicine','Children','Women and Pregnancy','Bones and Joints','ENT','Eyes','Skin'];
export const reasons: Record<Department,string> = {
  'General Medicine':'Fever, cough, blood pressure, or general health',
  Children:'Health concerns for a child',
  'Women and Pregnancy':'Women’s health and pregnancy care',
  'Bones and Joints':'Pain or injury in bones, joints, or muscles',
  ENT:'Ear, nose, or throat concerns',
  Eyes:'Eye check or eye discomfort',
  Skin:'Skin, hair, or nail concerns',
};
export const departmentMeta: Record<Department,{prefix:string;room:string;doctor:string;average:number}> = {
  'General Medicine':{prefix:'GM',room:'Room 1',doctor:'Dr. Meera Shah',average:12},
  Children:{prefix:'CH',room:'Room 2',doctor:'Dr. Arjun Rao',average:15},
  'Women and Pregnancy':{prefix:'WP',room:'Room 3',doctor:'Dr. Kavita Nair',average:16},
  'Bones and Joints':{prefix:'BJ',room:'Room 4',doctor:'Dr. Farah Khan',average:14},
  ENT:{prefix:'EN',room:'Room 5',doctor:'Dr. Neel Patel',average:10},
  Eyes:{prefix:'EY',room:'Room 6',doctor:'Dr. Ritu Das',average:11},
  Skin:{prefix:'SK',room:'Room 7',doctor:'Dr. Sana Joshi',average:10},
};
const firstNames = ['Asha','Ramesh','Farida','Vikram','Leela','Mohan','Sita','Imran','Kiran','Dev','Nirmala','Ravi','Pooja','Salim','Anita','Hari','Kamla','Arif','Jyoti','Suresh'];
export function starterPatients(): Patient[] {
  return firstNames.map((firstName,i) => {
    const department = departments[i % departments.length], meta = departmentMeta[department];
    return {id:`demo-${i+1}`,token:`${meta.prefix}-${String(Math.floor(i/departments.length)+1).padStart(2,'0')}`,firstName,age:23+(i*7)%58,gender:i%2?'Female':'Male',department,status:i<7?'waiting':i===7?'called':'waiting',registeredAt:new Date(Date.now()-((i+1)*6*60000)).toISOString(),doctor:meta.doctor,room:meta.room,floor:1};
  });
}
export function initialState(): HospitalState { return {patients:starterPatients(),urgent:{active:false,acknowledged:false},doctors:Object.fromEntries(departments.map(d=>[d,true])),delays:Object.fromEntries(departments.map(d=>[d,0]))}; }
export function waitEstimate(state: HospitalState, patient: Patient) {
  const ahead = state.patients.filter(p=>p.department===patient.department && p.status==='waiting' && p.id!==patient.id && new Date(p.registeredAt)<=new Date(patient.registeredAt)).length;
  const minutes = Math.max(0,Math.round((ahead*departmentMeta[patient.department].average+(state.delays[patient.department]||0))/5)*5);
  return {ahead,minutes};
}
