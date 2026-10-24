import { useState } from 'react';
import { initialState, type HospitalState } from './data';

// Per-mounted-preview state only: no localStorage, BroadcastChannel, or cross-preview synchronization.
export function useHospitalState(): [HospitalState,(updater:(current:HospitalState)=>HospitalState)=>void] {
  const [state,setState]=useState<HospitalState>(()=>initialState());
  const update=(updater:(current:HospitalState)=>HospitalState)=>setState(current=>updater(current));
  return [state,update];
}
