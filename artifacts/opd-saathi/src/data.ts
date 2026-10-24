export type Department = 'General Medicine' | 'Children' | 'Women and Pregnancy' | 'Bones and Joints' | 'ENT' | 'Eyes' | 'Skin';
export type SuggestedDepartment = Department | 'Help Desk';
export type AffectedArea = 'eyes' | 'skin' | 'ear-nose-throat' | 'bones-joints' | 'general' | 'child-health' | 'women-health' | 'unclear';
export type PatientStatus = 'pending-review' | 'waiting' | 'called' | 'no-show' | 'served';
export type DoctorStatus = 'Available' | 'On Break' | 'Delayed';
export type Patient = {
  id: string;
  token: string;
  firstName: string;
  age: number;
  gender: string;
  phone?: string;
  department: Department;
  assignedDepartment?: Department | null;
  suggestedDepartment?: SuggestedDepartment;
  requestedDepartment?: Department | null;
  symptoms?: string;
  affectedArea?: AffectedArea;
  duration?: string;
  additionalDetails?: string;
  helpDeskReview?: boolean;
  status: PatientStatus;
  registeredAt: string;
  doctor: string;
  room: string;
  floor: number;
};
export type UrgentAlert = {
  active: boolean;
  createdAt?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  token?: string;
  patientName?: string;
  phone?: string;
};
export type HospitalState = { patients: Patient[]; urgent: UrgentAlert; doctors: Record<string, DoctorStatus>; delays: Record<string, number> };
export const departments: Department[] = ['General Medicine','Children','Women and Pregnancy','Bones and Joints','ENT','Eyes','Skin'];
export const affectedAreas: {id:AffectedArea; label:string; department:SuggestedDepartment}[] = [
  {id:'eyes',label:'Eyes or vision',department:'Eyes'},
  {id:'skin',label:'Skin, hair, or nails',department:'Skin'},
  {id:'ear-nose-throat',label:'Ear, nose, or throat',department:'ENT'},
  {id:'bones-joints',label:'Bones, joints, or muscles',department:'Bones and Joints'},
  {id:'general',label:'General health',department:'General Medicine'},
  {id:'child-health',label:'A child’s health',department:'Children'},
  {id:'women-health',label:'Women’s health or pregnancy',department:'Women and Pregnancy'},
  {id:'unclear',label:'I am not sure',department:'Help Desk'},
];

/** Explicit symptom-selection rules. These suggest a starting department only; they do not assess urgency or diagnose. */
export const departmentSuggestionRules = affectedAreas;
export function suggestDepartment(area:AffectedArea, age:number):SuggestedDepartment {
  if (area === 'general' && age < 13) return 'Children';
  return departmentSuggestionRules.find(rule=>rule.id===area)?.department ?? 'Help Desk';
}

export function assignedDepartmentFor(patient:Patient):Department|null {
  if (patient.status === 'pending-review') return null;
  return patient.assignedDepartment ?? patient.department;
}

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
  Children:{prefix:'CH',room:'Room 3',doctor:'Dr. Arjun Rao',average:15},
  'Women and Pregnancy':{prefix:'WP',room:'Room 4',doctor:'Dr. Kavita Nair',average:16},
  'Bones and Joints':{prefix:'BJ',room:'Room 5',doctor:'Dr. Farah Khan',average:14},
  ENT:{prefix:'EN',room:'Room 6',doctor:'Dr. Neel Patel',average:10},
  Eyes:{prefix:'EY',room:'Room 7',doctor:'Dr. Ritu Das',average:11},
  Skin:{prefix:'SK',room:'Room 8',doctor:'Dr. Sana Joshi',average:10},
};
const firstNames = ['Asha','Ramesh','Farida','Vikram','Leela','Mohan','Sita','Imran','Kiran','Dev','Nirmala','Ravi','Pooja','Salim','Anita','Hari','Kamla','Arif','Jyoti','Suresh'];
export function starterPatients(): Patient[] {
  return firstNames.map((firstName,i) => {
    const department = departments[i % departments.length], meta = departmentMeta[department];
    return {id:`demo-${i+1}`,token:`${meta.prefix}-${String(Math.floor(i/departments.length)+1).padStart(2,'0')}`,firstName,age:23+(i*7)%58,gender:i%2?'Female':'Male',department,status:i<7?'waiting':i===7?'called':'waiting',registeredAt:new Date(Date.now()-((i+1)*6*60000)).toISOString(),doctor:meta.doctor,room:meta.room,floor:1};
  });
}
export function initialState(): HospitalState { return {patients:starterPatients(),urgent:{active:false,acknowledged:false},doctors:Object.fromEntries(departments.map(d=>[d,'Available'])),delays:Object.fromEntries(departments.map(d=>[d,0]))}; }
export function waitEstimate(state: HospitalState, patient: Patient) {
  const department=assignedDepartmentFor(patient);
  if(!department)return {ahead:0,minutes:0};
  const ahead = state.patients.filter(p=>assignedDepartmentFor(p)===department && p.status==='waiting' && p.id!==patient.id && new Date(p.registeredAt)<=new Date(patient.registeredAt)).length;
  const minutes = Math.max(0,Math.round((ahead*departmentMeta[department].average+(state.delays[department]||0))/5)*5);
  return {ahead,minutes};
}

export function nextPatientToken(patients:Patient[]) {
  const used=new Set(patients.map(patient=>patient.token.trim().toUpperCase()));
  const largest=patients.reduce((max,patient)=>{
    const match=/^OPD-(\d+)$/i.exec(patient.token.trim());
    return match?Math.max(max,Number(match[1])):max;
  },0);
  let sequence=largest+1;
  let token=`OPD-${String(sequence).padStart(3,'0')}`;
  while(used.has(token)){
    sequence+=1;
    token=`OPD-${String(sequence).padStart(3,'0')}`;
  }
  return token;
}
