import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('MMM D, YYYY [at] h:mm A');
};

export const formatRelativeTime = (dateString: string): string => {
  return dayjs(dateString).fromNow();
};
