export function convertTime (ttl: string): number {

    const args = ttl.match(/([0-9]{1}[0-9]{0,5}(m|s|h|d))/ig);

    if (!args) {
        return 0;
    }

    let seconds = 0;

    for (const element of args) {

        const value_text: string = element.replace(/(m|s|h|d)/g, "");
        const value: number = parseInt(value_text);

        if (element.includes("s")) {
            seconds += value;
        }

        if (element.includes("m")) {
            seconds += value * 60;
        }

        if (element.includes("h")) {
            seconds += value * 60 * 60;
        }

        if (element.includes("d")) {
            seconds += value * 60 * 60 * 24;
        }

    }

    return seconds;

}