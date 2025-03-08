export { };


type Vars = [
  'SOURCE_CALENDAR_ID',
  'TARGET_CALENDAR_ID',
  'TARGET_COLOR_ID'
]
declare global {
  const ENV: {
    [key in Vars[number]]: string;
  };
}
