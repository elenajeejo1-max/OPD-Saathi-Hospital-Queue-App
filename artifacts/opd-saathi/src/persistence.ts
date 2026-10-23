import { useEffect, useState } from 'react';
import { initialState, type HospitalState } from './data';
const KEY='opd-saathi-demo-state-v1';
const CHANNEL='opd-saathi-sync-v1';
export function readState(): HospitalState {
  try { const raw=localStorage.getItem(KEY); if(raw) return {...initialState(),...JSON.parse(raw)}; } catch {}
  return initialState();
}
export function writeState(next: HospitalState) {
  localStorage.setItem(KEY,JSON.stringify(next));
  try { const channel=new BroadcastChannel(CHANNEL); channel.postMessage(next); channel.close(); } catch {}
}
export function useHospitalState(): [HospitalState,(updater:(current:HospitalState)=>HospitalState)=>void] {
  const [state,setState]=useState<HospitalState>(()=>readState());
  useEffect(()=>{
    const onStorage=(event:StorageEvent)=>{if(event.key===KEY&&event.newValue){try{setState({...initialState(),...JSON.parse(event.newValue)});}catch{}}};
    let channel:BroadcastChannel|undefined;
    try {channel=new BroadcastChannel(CHANNEL);channel.onmessage=e=>setState({...initialState(),...e.data});}catch{}
    window.addEventListener('storage',onStorage);return()=>{window.removeEventListener('storage',onStorage);channel?.close();};
  },[]);
  const update=(updater:(current:HospitalState)=>HospitalState)=>setState(current=>{const next=updater(current);writeState(next);return next;});
  return [state,update];
}
