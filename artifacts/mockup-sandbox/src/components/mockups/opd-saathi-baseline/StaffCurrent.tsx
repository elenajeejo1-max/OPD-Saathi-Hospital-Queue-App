import './_group.css';
import { useHospitalState } from './persistence';
import { Staff } from './source-components';
import type { Lang } from './translations';

export function StaffCurrent() {
  const [state,update]=useHospitalState();
  const lang:Lang='en';
  return <div className="min-h-screen"><Staff state={state} update={update} lang={lang} setLang={()=>{}}/></div>;
}
