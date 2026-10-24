import './_group.css';
import { EmergencyNoticePreview } from './source-components';
import type { Lang } from './translations';

export function EmergencyCurrent() {
  const lang:Lang='en';
  return <div className="min-h-screen"><EmergencyNoticePreview lang={lang}/></div>;
}
