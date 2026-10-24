import './_group.css';
import { useHospitalState } from './persistence';
import { Board } from './source-components';
import type { Lang } from './translations';

export function BoardCurrent() {
  const [state]=useHospitalState();
  const lang:Lang='en';
  return <div className="min-h-screen"><Board state={state} update={()=>{}} lang={lang} setLang={()=>{}}/></div>;
}
