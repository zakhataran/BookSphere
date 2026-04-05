import dayjs from 'dayjs';

export const dateFormatter = (stringDate?: string | number) => {
  const date = new Date(stringDate ? String(stringDate) : dayjs().toString());
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};
