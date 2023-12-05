export const getDateTimeString = (date: Date) => {
    const dateString = date.toLocaleDateString();
    const timeString = getTimeString(date);
    return `${dateString} ${timeString}`;
};

export function getTimeString(date: Date) {
    const filledHours = fillTimePart(date.getHours());
    const filledMinutes = fillTimePart(date.getMinutes());
    const filledSeconds = fillTimePart(date.getSeconds());
    return filledHours + ':' + filledMinutes + ':' + filledSeconds;
}

function fillTimePart(timePart: number) {
    let filledTimePart = '' + timePart;
    if (fillTimePart.length === 1) {
        filledTimePart = '0' + fillTimePart;
    }
    return filledTimePart;
}
