import { userState } from "./userState";

export function setStateTimeout(
    chatId: number,
    state: string
) {
    setTimeout(() => {
        if (userState.get(chatId) === state) {
            userState.delete(chatId);
        }
    }, 100000);
}
