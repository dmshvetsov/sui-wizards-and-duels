export function getPid(): string {
    const pid = import.meta.env.VITE_WIZARDS_AND_DUELS_PID_V1
    if (!pid) {
        throw new Error('Configuration error PACKAGE ID V1 is not defined')
    }
    return pid
}

export function getPidLatest(): string {
    const pid = import.meta.env.VITE_WIZARDS_AND_DUELS_PID_LATEST
    if (!pid) {
        throw new Error('Configuration error PACKAGE ID LATEST is not defined')
    }
    return pid
}


