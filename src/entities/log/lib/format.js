const LEVELS = { info: 'INFO', success: 'OK', warn: 'WARN', error: 'ERROR' };

const clock = (iso) => new Date(iso).toLocaleTimeString('uk-UA', { hour12: false });

export const formatLogLine = (entry) => `[${clock(entry.time)}] ${LEVELS[entry.level] ?? 'INFO'}  ${entry.message}`;

export const logToText = (entries) =>
  entries
    .map((e) => `${new Date(e.time).toLocaleString('uk-UA', { hour12: false })}\t${LEVELS[e.level] ?? 'INFO'}\t${e.message}`)
    .join('\n');
