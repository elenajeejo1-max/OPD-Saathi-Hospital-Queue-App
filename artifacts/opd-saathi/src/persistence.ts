import { useEffect, useState } from 'react';
import { departments, initialState, type DoctorStatus, type HospitalState, type Patient } from './data';
const KEY='opd-saathi-demo-state-v1';
const CHANNEL='opd-saathi-sync-v1';

function normalizeState(raw:unknown):HospitalState {
  const base=initialState();
  const saved=(raw&&typeof raw==='object'?raw:{}) as Partial<HospitalState>;
  const patients=Array.isArray(saved.patients)?saved.patients.map((record)=>{
    const patient=record as Patient;
    return {
      ...patient,
      assignedDepartment:patient.assignedDepartment??(patient.status==='pending-review'?null:patient.department),
      suggestedDepartment:patient.suggestedDepartment??patient.department,
    };
  }):base.patients;
  const oldDoctors=(saved.doctors??{}) as Record<string,DoctorStatus|boolean>;
  return {
    ...base,
    ...saved,
    patients,
    urgent:{...base.urgent,...saved.urgent},
    doctors:Object.fromEntries(departments.map(department=>{
      const status=oldDoctors[department];
      return [department,status===true?'Available':status===false?'On Break':status??'Available'];
    })),
    delays:{...base.delays,...saved.delays},
  };
}

export function readState(): HospitalState {
  try { const raw=localStorage.getItem(KEY); if(raw) return normalizeState(JSON.parse(raw)); } catch {}
  return initialState();
}
export function writeState(next: HospitalState) {
  localStorage.setItem(KEY,JSON.stringify(next));
  try { const channel=new BroadcastChannel(CHANNEL); channel.postMessage(next); channel.close(); } catch {}
}
export function useHospitalState(): [HospitalState,(updater:(current:HospitalState)=>HospitalState)=>void] {
  const [state,setState]=useState<HospitalState>(()=>readState());
  useEffect(()=>{
    const onStorage=(event:StorageEvent)=>{if(event.key===KEY){try{setState(event.newValue?normalizeState(JSON.parse(event.newValue)):initialState());}catch{}}};
    let channel:BroadcastChannel|undefined;
    try {channel=new BroadcastChannel(CHANNEL);channel.onmessage=e=>setState(normalizeState(e.data));}catch{}
    window.addEventListener('storage',onStorage);return()=>{window.removeEventListener('storage',onStorage);channel?.close();};
  },[]);
  const update=(updater:(current:HospitalState)=>HospitalState)=>setState(current=>{const next=updater(current);writeState(next);return next;});
  return [state,update];
}
