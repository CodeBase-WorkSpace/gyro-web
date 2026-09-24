const LOCAL_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function resolveReminderTime(submittedTime: string, enabled: boolean, fallbackTime = "08:00") {
  if (LOCAL_TIME_PATTERN.test(submittedTime)) return submittedTime;
  return enabled ? null : fallbackTime;
}
