const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});
export function formatLocalDate(date = new Date()) {
    return DATE_FORMATTER.format(date);
}
export function parseLocalDate(date) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
}
//# sourceMappingURL=date.js.map