export const getFormatedDate = (eventDate) => {
  const today = eventDate;
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  const yyyy = today.getFullYear();

  return yyyy + '-' + mm + '-' + dd;
};

export const getCurrentHour = () => {
  const today = new Date();
  const hours = today.getHours();
  const minutes = String(today.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
};
