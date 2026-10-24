export type Lang = 'en';

const englishLabels: Record<string, string> = {
  Slip: 'My slip',
  Queue: 'My queue',
  Navigate: 'Find a place',
  Assistant: 'Hospital help',
  Staff: 'Staff view',
  Board: 'Queue board',
  Children: "Children's Clinic",
  'Women and Pregnancy': "Women's Health",
  Eyes: 'Eye Clinic',
  Skin: 'Skin Clinic',
};

export function t(value: string, _lang: Lang = 'en') {
  return englishLabels[value] ?? value;
}
